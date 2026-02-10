import type { TaskPriority } from '../types/database'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash']
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface AITaskExtraction {
    project: string
    task: string
    priority: TaskPriority
    due_date: string | null
    confidence: number
}

const SYSTEM_PROMPT = `Sos un asistente de taller metalúrgico. Extraé datos del audio en JSON:
{"project":"CLIENTE","task":"TAREA","priority":"alta|media|baja","due_date":"YYYY-MM-DD|null","confidence":0.0-1.0}
Reglas: urgente→alta, sin mención→media, "para hoy"→fecha de hoy, solo JSON.`

/**
 * Calls Gemini with retry on 429/503, and model fallback.
 */
async function callGemini(body: object): Promise<any> {
    for (const model of MODELS) {
        const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })

                if (res.ok) {
                    console.log(`[Gemini] OK con ${model}`)
                    return res.json()
                }

                if ((res.status === 429 || res.status === 503) && attempt === 0) {
                    console.warn(`[Gemini] ${model} → ${res.status}, reintentando en 3s...`)
                    await new Promise(r => setTimeout(r, 3000))
                    continue
                }

                if (res.status === 404 || res.status === 503) {
                    console.warn(`[Gemini] ${model} → ${res.status}, probando siguiente modelo...`)
                    break // try next model
                }

                const errText = await res.text().catch(() => '')
                console.error(`[Gemini] ${model} ${res.status}:`, errText)

                if (res.status === 429) {
                    throw new Error('Límite de uso alcanzado. Esperá unos segundos e intentá de nuevo.')
                }
                throw new Error(`Error de Gemini (${res.status})`)
            } catch (e: any) {
                if (e.message?.includes('Límite') || e.message?.includes('Error de Gemini')) throw e
                console.error(`[Gemini] ${model} network error:`, e)
                break // try next model
            }
        }
    }
    throw new Error('No se pudo conectar con ningún modelo de Gemini. Intentá de nuevo.')
}

function parseResult(data: any): AITaskExtraction {
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) throw new Error('Sin respuesta de la IA')

    console.log('[Gemini raw]', raw)

    let text = raw.trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    if (!text.endsWith('}')) text += '"}'

    try {
        const parsed = JSON.parse(text)
        return {
            project: parsed.project || 'SIN PROYECTO',
            task: parsed.task || 'TAREA SIN NOMBRE',
            priority: (['alta', 'media', 'baja'].includes(parsed.priority) ? parsed.priority : 'media') as TaskPriority,
            due_date: parsed.due_date || null,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        }
    } catch (e) {
        console.error('[Gemini parse error]', e, 'Raw:', raw)
        const project = raw.match(/"project"\s*:\s*"([^"]*)"/)?.[1] || 'SIN PROYECTO'
        const task = raw.match(/"task"\s*:\s*"([^"]*)"/)?.[1] || 'TAREA SIN NOMBRE'
        const priority = raw.match(/"priority"\s*:\s*"([^"]*)"/)?.[1] || 'media'
        const dueDate = raw.match(/"due_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1] || null
        const conf = raw.match(/"confidence"\s*:\s*([\d.]+)/)?.[1]
        return {
            project,
            task,
            priority: (['alta', 'media', 'baja'].includes(priority) ? priority : 'media') as TaskPriority,
            due_date: dueDate,
            confidence: conf ? parseFloat(conf) : 0.5,
        }
    }
}

export async function extractTaskFromAudio(audioBlob: Blob): Promise<AITaskExtraction> {
    if (!GEMINI_API_KEY) throw new Error('API Key de Gemini no configurada')

    const base64 = await blobToBase64(audioBlob)
    const today = new Date().toISOString().split('T')[0]

    const data = await callGemini({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
            parts: [
                { inline_data: { mime_type: audioBlob.type || 'audio/webm', data: base64 } },
                { text: `Fecha de hoy: ${today}. Extraé la tarea del audio.` },
            ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200, responseMimeType: 'application/json' },
    })

    return parseResult(data)
}

export async function extractTaskFromText(text: string): Promise<AITaskExtraction> {
    if (!GEMINI_API_KEY) throw new Error('API Key de Gemini no configurada')

    const today = new Date().toISOString().split('T')[0]

    const data = await callGemini({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Fecha: ${today}. Texto: "${text}"` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200, responseMimeType: 'application/json' },
    })

    return parseResult(data)
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
