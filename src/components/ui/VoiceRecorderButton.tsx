import { useState, useRef, useEffect } from 'react'
import { extractTaskFromAudio, type AITaskExtraction } from '../../lib/gemini'
import { cn } from '../../lib/utils'

interface VoiceRecorderButtonProps {
    onProcessed: (data: AITaskExtraction) => void
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function VoiceRecorderButton({ onProcessed, size = 'md', className }: VoiceRecorderButtonProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // Recording animation bars
    const [bars, setBars] = useState<number[]>([3, 4, 3])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>
        if (isRecording) {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.floor(Math.random() * 8) + 3))
            }, 100)
        } else {
            setBars([3, 4, 3])
        }
        return () => clearInterval(interval)
    }, [isRecording])

    const startRecording = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
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

                setIsProcessing(true)
                try {
                    const result = await extractTaskFromAudio(blob)
                    onProcessed(result)
                } catch (err) {
                    setError('Error al procesar audio')
                    console.error('Voice processing error:', err)
                } finally {
                    setIsProcessing(false)
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch {
            setError('Sin acceso al micrófono')
        }
    }

    const stopRecording = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    }

    const iconSizes = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl'
    }

    return (
        <div className={cn("relative inline-flex items-center", className)}>
            {/* Error Message Tooltip */}
            {error && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded shadow-sm whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1">
                    {error}
                </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full z-10">
                    <span className="w-4 h-4 border-2 border-hc-accent border-t-transparent rounded-full animate-spin"></span>
                </div>
            )}

            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={cn(
                    "rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-1",
                    sizeClasses[size],
                    isRecording
                        ? "bg-red-50 border-red-200 text-red-600 animate-pulse ring-red-200"
                        : "bg-white border-gray-200 text-gray-500 hover:text-hc-accent hover:border-hc-accent hover:bg-hc-accent-light active:scale-95",
                    isProcessing && "opacity-50 cursor-not-allowed"
                )}
                title={isRecording ? "Detener grabación" : "Grabar audio"}
            >
                {isRecording ? (
                    <div className="flex items-center gap-[2px]">
                        {bars.map((h, i) => (
                            <div
                                key={i}
                                className="w-[3px] bg-red-500 rounded-full transition-all duration-100"
                                style={{ height: `${h}px` }}
                            />
                        ))}
                    </div>
                ) : (
                    <span className={`material-symbols-outlined ${iconSizes[size]}`}>mic</span>
                )}
            </button>
        </div>
    )
}
