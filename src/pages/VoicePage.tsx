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
                    const maxHeight = 18 * (1 - distFromCenter * 0.4)
                    return Math.floor(Math.random() * maxHeight) + 3
                }))
            }, 120)
            return () => clearInterval(interval)
        } else {
            setBars(Array(NUM_BARS).fill(3))
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
                                priority: result.priority,
                                due_date: result.due_date || new Date().toISOString().split('T')[0],
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
        <>
            <TopBar
                title="Grabación de Voz"
                subtitle="Dictá una tarea o instrucción"
                actions={
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-2 border-[2px] border-black rounded-xl text-sm font-bold uppercase hover:bg-hc-surface transition-all"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Volver
                    </button>
                }
            />

            <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 max-w-2xl mx-auto w-full">
                {/* Processing overlay */}
                {isProcessing && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                        <div className="bg-white border-[3px] border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_#000000] text-center max-w-sm mx-4">
                            <div className="w-16 h-16 mx-auto mb-4 bg-hc-accent rounded-2xl border-2 border-black flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-white animate-spin">progress_activity</span>
                            </div>
                            <h3 className="text-xl font-black uppercase text-black mb-2">Procesando con IA</h3>
                            <p className="text-sm font-bold text-gray-500">
                                Analizando audio con Gemini...
                            </p>
                            <div className="mt-4 flex justify-center gap-1">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-2.5 h-2.5 bg-hc-accent rounded-full"
                                        style={{ animation: `dotPulse 1s ease-in-out infinite ${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recording area */}
                <div className="w-full bg-white border-[3px] border-black rounded-2xl p-8 lg:p-12 card-shadow flex flex-col items-center">
                    {/* Error message */}
                    {error && (
                        <div className="w-full mb-6 bg-red-50 border-[2px] border-red-400 rounded-xl p-3.5 flex items-start gap-3">
                            <span className="material-symbols-outlined text-lg text-red-500 mt-0.5">error</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-red-700">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-xs font-extrabold text-red-500 uppercase mt-1 hover:underline"
                                >
                                    Descartar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Concentric rings + button */}
                    <div className="relative flex items-center justify-center mb-8">
                        <div className={`absolute w-48 h-48 rounded-full transition-all duration-1000 ${isRecording ? 'border-[3px] border-hc-accent/30' : 'border-[2px] border-gray-100'
                            }`}
                            style={isRecording ? { animation: 'pulseRing 2s ease-in-out infinite' } : {}}
                        />
                        <div className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${isRecording ? 'border-[3px] border-hc-highlight/60' : 'border-[2px] border-gray-50'
                            }`}
                            style={isRecording ? { animation: 'pulseRing 2s ease-in-out infinite 0.3s' } : {}}
                        />
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            className={`w-28 h-28 rounded-full flex items-center justify-center border-[4px] border-black transition-all duration-200 disabled:opacity-50 ${isRecording
                                    ? 'bg-red-500 shadow-[4px_4px_0px_0px_#000000] hover:bg-red-600'
                                    : 'bg-hc-accent shadow-[5px_5px_0px_0px_#000000] hover:bg-hc-accent-dark'
                                } active:translate-y-[2px] active:shadow-none`}
                            style={isRecording ? { animation: 'breathe 2s ease-in-out infinite' } : {}}
                        >
                            <span className="material-symbols-outlined text-white icon-filled" style={{ fontSize: '3rem' }}>
                                {isRecording ? 'stop' : 'mic'}
                            </span>
                        </button>
                    </div>

                    {/* Status */}
                    <h2 className="text-xl font-black text-black uppercase mb-6 text-center">
                        {isRecording ? (
                            <span className="flex items-center gap-2 text-red-500">
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" style={{ animation: 'dotPulse 1s ease-in-out infinite' }} />
                                Escuchando...
                            </span>
                        ) : 'Toque el micrófono para grabar'}
                    </h2>

                    {/* Waveform */}
                    <div aria-hidden="true" className="h-12 w-full max-w-md flex items-center justify-center gap-[2px] px-2 mb-6">
                        {bars.map((h, i) => (
                            <div
                                key={i}
                                className="waveform-bar rounded-full"
                                style={{
                                    height: `${h * 2.5}px`,
                                    backgroundColor: isRecording
                                        ? `hsl(220, ${70 + (i % 3) * 10}%, ${40 + (i % 5) * 5}%)`
                                        : '#D1D5DB',
                                    opacity: isRecording ? 0.85 + (i % 3) * 0.05 : 0.25,
                                    width: '4px',
                                }}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    <div className={`text-3xl font-black font-mono tracking-wider px-5 py-2 rounded-xl border-[2px] transition-colors ${isRecording ? 'text-red-500 border-red-300 bg-red-50' : 'text-gray-400 border-gray-200 bg-hc-surface'
                        }`}>
                        {formatTime(seconds)}
                    </div>
                </div>

                {/* Action button below card */}
                <div className="w-full mt-6 max-w-md">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`w-full py-4 border-[3px] border-black font-black text-xl uppercase rounded-xl shadow-[4px_4px_0px_0px_#000000] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isRecording
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-hc-accent text-white hover:bg-hc-accent-dark'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl icon-filled">
                            {isRecording ? 'stop_circle' : 'mic'}
                        </span>
                        {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                    </button>
                    <p className="text-center mt-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        {isRecording ? 'Toque para finalizar y enviar a la IA' : 'Dicte una orden, tarea o instrucción'}
                    </p>
                </div>
            </main>
        </>
    )
}
