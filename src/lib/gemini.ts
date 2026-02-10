import type { TaskPriority } from '../types/database'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export interface AITaskExtraction {
    project: string
    task: string
    priority: TaskPriority
    due_date: string | null
    confidence: number
}

/**
 * Sends audio to Gemini 2.0 Flash for task extraction.
 * Uses the multimodal API to process audio and extract structured task data.
 */
export async function extractTaskFromAudio(audioBlob: Blob): Promise<AITaskExtraction> {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada')
    }

    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob)
    const mimeType = audioBlob.type || 'audio/webm'

    const today = new Date().toISOString().split('T')[0]

    const prompt = `Sos un asistente para un taller metalúrgico (Job Shop). 
Escuchá el audio y extraé la siguiente información en formato JSON estricto:

{
  "project": "nombre del cliente o proyecto mencionado (en MAYÚSCULAS)",
  "task": "descripción corta de la tarea (en MAYÚSCULAS, máx 50 caracteres)",
  "priority": "alta" | "media" | "baja",
  "due_date": "YYYY-MM-DD o null si no se menciona fecha",
  "confidence": 0.0 a 1.0
}

Reglas:
- Si mencionan urgencia, prioridad "alta"
- Si no mencionan prioridad, usar "media"
- Si mencionan "para hoy" o "urgente", due_date = "${today}"
- Si mencionan "para mañana", calcular la fecha
- Si no entendés algo, usá confidence bajo
- Respondé SOLO con el JSON, sin texto adicional ni markdown`

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Audio,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
            responseMimeType: 'application/json',
        },
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        }
    )

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error:', errorText)
        throw new Error(`Error de la API de Gemini: ${response.status}`)
    }

    const data = await response.json()

    // Extract the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResponse) {
        throw new Error('No se recibió respuesta de la IA')
    }

    // Parse the JSON response
    try {
        const parsed = JSON.parse(textResponse)
        return {
            project: parsed.project || 'SIN PROYECTO',
            task: parsed.task || 'TAREA SIN NOMBRE',
            priority: (['alta', 'media', 'baja'].includes(parsed.priority) ? parsed.priority : 'media') as TaskPriority,
            due_date: parsed.due_date || null,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        }
    } catch {
        console.error('Failed to parse Gemini response:', textResponse)
        throw new Error('No se pudo interpretar la respuesta de la IA')
    }
}

/**
 * Sends text to Gemini for task extraction (fallback / text mode).
 */
export async function extractTaskFromText(text: string): Promise<AITaskExtraction> {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada')
    }

    const today = new Date().toISOString().split('T')[0]

    const prompt = `Sos un asistente para un taller metalúrgico (Job Shop). 
Analizá el texto y extraé la siguiente información en formato JSON estricto:

Texto: "${text}"

{
  "project": "nombre del cliente o proyecto mencionado (en MAYÚSCULAS)",
  "task": "descripción corta de la tarea (en MAYÚSCULAS, máx 50 caracteres)", 
  "priority": "alta" | "media" | "baja",
  "due_date": "YYYY-MM-DD o null si no se menciona fecha",
  "confidence": 0.0 a 1.0
}

Reglas:
- Si mencionan urgencia, prioridad "alta"
- Si no mencionan prioridad, usar "media"
- Si mencionan "para hoy" o "urgente", due_date = "${today}"
- Respondé SOLO con el JSON, sin texto adicional ni markdown`

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 256,
                    responseMimeType: 'application/json',
                },
            }),
        }
    )

    if (!response.ok) {
        throw new Error(`Error de la API de Gemini: ${response.status}`)
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResponse) throw new Error('No se recibió respuesta de la IA')

    const parsed = JSON.parse(textResponse)
    return {
        project: parsed.project || 'SIN PROYECTO',
        task: parsed.task || 'TAREA SIN NOMBRE',
        priority: (['alta', 'media', 'baja'].includes(parsed.priority) ? parsed.priority : 'media') as TaskPriority,
        due_date: parsed.due_date || null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
