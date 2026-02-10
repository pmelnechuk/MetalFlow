import type { TaskPriority } from '../types/database'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash']
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface AITaskExtraction {
    project: string
    task: string
    description: string
    priority: TaskPriority
    due_date: string | null
    assigned_to: string[]
    confidence: number
}

const SYSTEM_PROMPT = `Sos un asistente de taller metalúrgico. Extraé datos del audio y devolvé SOLO JSON:
{"project":"CLIENTE","task":"TÍTULO CORTO","description":"DESCRIPCIÓN DETALLADA","priority":"alta|media|baja","due_date":"YYYY-MM-DD|null","assigned_to":["NOMBRE1","NOMBRE2"],"confidence":0.0-1.0}
Reglas: urgente→alta, sin mención→media, "para hoy"→fecha de hoy. Si no menciona empleados→array vacío. description=detalle de qué hacer.
RESPOND ONLY WITH RAW JSON. START WITH '{'. NO MARKDOWN. NO CONVERSATIONAL TEXT.`

/**
 * Calls Gemini with retry on 429/503, and model fallback.
 */
async function callGemini(body: object): Promise<any> {
    let lastError = ''

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
                    console.log(`[Gemini] ✓ Respuesta OK de ${model}`)
                    return res.json()
                }

                lastError = `${model}: ${res.status}`

                if ((res.status === 429 || res.status === 503) && attempt === 0) {
                    console.warn(`[Gemini] ${model} → ${res.status}, reintentando en 3s...`)
                    await new Promise(r => setTimeout(r, 3000))
                    continue
                }

                if (res.status === 404 || res.status === 503) {
                    console.warn(`[Gemini] ${model} → ${res.status}, probando siguiente modelo...`)
                    break
                }

                if (res.status === 429) {
                    throw new Error('Límite de uso alcanzado. Esperá unos segundos e intentá de nuevo.')
                }
                throw new Error(`Error de Gemini (${res.status})`)
            } catch (e: any) {
                if (e.message?.includes('Límite') || e.message?.includes('Error de Gemini')) throw e
                console.error(`[Gemini] ${model} error de red:`, e)
                lastError = `${model}: ${e.message}`
                break
            }
        }
    }
    throw new Error(`No se pudo conectar con Gemini (${lastError}). Intentá de nuevo.`)
}

/**
 * Extract text from Gemini response, handling "thinking" models
 * that return thought parts before the actual response.
 */
function extractText(data: any): string {
    const candidates = data?.candidates
    if (!candidates?.length) {
        console.error('[Gemini] No candidates in response:', JSON.stringify(data).slice(0, 500))
        throw new Error('Sin respuesta de la IA')
    }

    const parts = candidates[0]?.content?.parts
    if (!parts?.length) {
        console.error('[Gemini] No parts in candidate:', JSON.stringify(candidates[0]).slice(0, 500))
        throw new Error('Respuesta vacía de la IA')
    }

    console.log(`[Gemini] ${parts.length} part(s) en la respuesta`)

    // Extract valid text from ALL non-thought parts
    const textParts = parts
        .filter((part: any) => !part.thought && part.text)
        .map((part: any) => part.text)

    if (textParts.length > 0) {
        return textParts.join('').trim()
    }

    // Fallback: try any part with text (even thought parts)
    for (const part of parts) {
        if (part.text?.includes('{')) return part.text
    }

    console.error('[Gemini] No text found in parts:', JSON.stringify(parts).slice(0, 500))
    throw new Error('No se encontró texto en la respuesta de la IA')
}

function parseResult(data: any): AITaskExtraction {
    const raw = extractText(data)
    console.log('[Gemini raw response]', raw)

    // Extract JSON object: find first '{' and last '}'
    const firstOpen = raw.indexOf('{')
    const lastClose = raw.lastIndexOf('}')

    let text = ''
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        text = raw.substring(firstOpen, lastClose + 1)
    } else {
        // Fallback: cleanup markdown if no clear JSON object found (unlikely)
        text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    }

    try {
        const parsed = JSON.parse(text)
        return {
            project: parsed.project || 'SIN PROYECTO',
            task: parsed.task || 'TAREA SIN NOMBRE',
            description: parsed.description || '',
            priority: (['alta', 'media', 'baja'].includes(parsed.priority) ? parsed.priority : 'media') as TaskPriority,
            due_date: parsed.due_date || null,
            assigned_to: Array.isArray(parsed.assigned_to) ? parsed.assigned_to : [],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        }
    } catch (e) {
        console.error('[Gemini parse error]', e, 'Text:', text)
        // Regex fallback
        const project = raw.match(/"project"\s*:\s*"([^"]*)"/)?.[1] || 'SIN PROYECTO'
        const task = raw.match(/"task"\s*:\s*"([^"]*)"/)?.[1] || 'TAREA SIN NOMBRE'
        const description = raw.match(/"description"\s*:\s*"([^"]*)"/)?.[1] || ''
        const priority = raw.match(/"priority"\s*:\s*"([^"]*)"/)?.[1] || 'media'
        const dueDate = raw.match(/"due_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1] || null
        const conf = raw.match(/"confidence"\s*:\s*([\d.]+)/)?.[1]
        return {
            project,
            task,
            description,
            priority: (['alta', 'media', 'baja'].includes(priority) ? priority : 'media') as TaskPriority,
            due_date: dueDate,
            assigned_to: [],
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' },
    })

    return parseResult(data)
}

export async function extractTaskFromText(text: string): Promise<AITaskExtraction> {
    if (!GEMINI_API_KEY) throw new Error('API Key de Gemini no configurada')

    const today = new Date().toISOString().split('T')[0]

    const data = await callGemini({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Fecha: ${today}. Texto: "${text}"` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' },
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
