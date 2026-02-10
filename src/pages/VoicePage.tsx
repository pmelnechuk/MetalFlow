import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { extractTaskFromAudio } from '../lib/gemini'

export function VoicePage() {
    const navigate = useNavigate()
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [seconds, setSeconds] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const NUM_BARS = 32
    const [bars, setBars] = useState<number[]>(Array(NUM_BARS).fill(3))

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setBars(prev => prev.map((_, i) => {
                    const center = NUM_BARS / 2
                    const distFromCenter = Math.abs(i - center) / center
                    const maxHeight = 24 * (1 - distFromCenter * 0.4)
                    return Math.floor(Math.random() * maxHeight) + 4
                }))
            }, 100)
            return () => clearInterval(interval)
        } else {
            setBars(Array(NUM_BARS).fill(4))
        }
    }, [isRecording])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                stream.getTracks().forEach(track => track.stop())

                // Process with Gemini AI
                setIsProcessing(true)
                try {
                    const result = await extractTaskFromAudio(blob)
                    setIsProcessing(false)
                    navigate('/voz/revision', {
                        state: {
                            audioBlob: blob,
                            aiResult: result,
                            mockData: {
                                project: result.project,
                                task: result.task,
                                description: result.description || '',
                                priority: result.priority,
                                due_date: result.due_date || new Date().toISOString().split('T')[0],
                                assigned_to: result.assigned_to || [],
                            },
                        },
                    })
                } catch (err) {
                    setIsProcessing(false)
                    setError(err instanceof Error ? err.message : 'Error procesando audio')
                    console.error('AI processing error:', err)
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setSeconds(0)
            timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000)
        } catch {
            setError('No se puede acceder al micrófono. Por favor permití el acceso.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        }
    }

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60).toString().padStart(2, '0')
        const secs = (s % 60).toString().padStart(2, '0')
        return `${mins}:${secs}`
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar
                title="Grabación de Voz"
                subtitle="Dictá una tarea o instrucción"
                actions={
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold uppercase hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Volver
                    </button>
                }
            />

            <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 max-w-2xl mx-auto w-full relative">
                {/* Processing overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center rounded-2xl">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-navy-50 rounded-full flex items-center justify-center relative">
                                <span className="material-symbols-outlined text-3xl text-navy-900 animate-spin">smart_toy</span>
                                <div className="absolute inset-0 rounded-full border-2 border-navy-100 animate-ping opacity-20"></div>
                            </div>
                            <h3 className="text-lg font-bold uppercase text-navy-900 mb-2">Procesando con IA</h3>
                            <p className="text-sm font-medium text-gray-500">
                                Analizando audio con Gemini...
                            </p>
                            <div className="mt-6 flex justify-center gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 bg-navy-900 rounded-full"
                                        style={{ animation: `pulse 1s ease-in-out infinite ${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recording Interface */}
                <div className="w-full bg-white border border-gray-200 rounded-2xl p-8 lg:p-12 shadow-md flex flex-col items-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#162F65_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* Error message */}
                    {error && (
                        <div className="w-full mb-8 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 relative z-10">
                            <span className="material-symbols-outlined text-lg text-red-600 mt-0.5">error</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-red-700">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-xs font-bold text-red-500 uppercase mt-1 hover:text-red-800 transition-colors"
                                >
                                    Descartar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Button with Rings */}
                    <div className="relative flex items-center justify-center mb-10 z-10">
                        {/* Outer Rings */}
                        <div className={`absolute w-64 h-64 rounded-full border border-navy-50 transition-all duration-1000 ${isRecording ? 'scale-110 opacity-100' : 'scale-75 opacity-0'}`} />
                        <div className={`absolute w-48 h-48 rounded-full border border-navy-100 transition-all duration-1000 ${isRecording ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} />

                        {/* Pulse Ring */}
                        {isRecording && (
                            <div className="absolute w-32 h-32 bg-red-50 rounded-full animate-ping opacity-20"></div>
                        )}

                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl z-20 hover:scale-105 active:scale-95 border-4 ${isRecording
                                ? 'bg-red-600 border-red-100 shadow-red-200'
                                : 'bg-navy-900 border-navy-100 shadow-navy-200 hover:bg-navy-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-white icon-filled" style={{ fontSize: '2.5rem' }}>
                                {isRecording ? 'stop' : 'mic'}
                            </span>
                        </button>
                    </div>

                    {/* Status Text */}
                    <h2 className="text-lg font-bold text-navy-900 uppercase mb-8 text-center tracking-wide z-10">
                        {isRecording ? (
                            <span className="flex items-center gap-2 text-red-600 animate-pulse">
                                <span className="w-2 h-2 bg-red-600 rounded-full" />
                                Escuchando...
                            </span>
                        ) : 'Toque el micrófono para grabar'}
                    </h2>

                    {/* Waveform Visualization */}
                    <div aria-hidden="true" className="h-16 w-full max-w-sm flex items-center justify-center gap-[3px] px-2 mb-8 z-10">
                        {bars.map((h, i) => (
                            <div
                                key={i}
                                className="rounded-full transition-all duration-100 ease-linear"
                                style={{
                                    height: `${h * 2}px`,
                                    backgroundColor: isRecording
                                        ? `rgba(10, 25, 47, ${0.4 + (h / 24)})` // Dynamic opacity based on height
                                        : '#E2E8F0',
                                    width: '4px',
                                }}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    <div className={`text-2xl font-black font-mono tracking-widest px-6 py-2 rounded-lg border transition-colors z-10 ${isRecording ? 'text-red-600 border-red-100 bg-red-50' : 'text-gray-400 border-gray-100 bg-gray-50'
                        }`}>
                        {formatTime(seconds)}
                    </div>
                </div>

                {/* Instructions */}
                {!isRecording && !isProcessing && (
                    <p className="text-center mt-6 text-gray-400 font-medium text-xs uppercase tracking-wider max-w-xs">
                        Dicte una orden clara y concisa. La IA extraerá automáticamente la tarea y sus detalles.
                    </p>
                )}
            </main>
        </div>
    )
}
