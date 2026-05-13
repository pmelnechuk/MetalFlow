import { useRef, useState } from 'react'

interface Props {
    onFileSelected: (file: File, previewUrl: string) => void
    previewUrl?: string
    loading?: boolean
    label?: string
}

export function ReceiptUploader({ onFileSelected, previewUrl, loading, label = 'Adjuntar factura' }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return
        const url = URL.createObjectURL(file)
        onFileSelected(file, url)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    if (previewUrl) {
        return (
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 group">
                <img src={previewUrl} alt="Factura" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-navy-900 font-bold text-xs uppercase px-3 py-1.5 rounded-lg shadow"
                    >
                        Cambiar
                    </button>
                </div>
                {loading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-navy-900">
                            <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                            <span className="text-xs font-bold">Analizando...</span>
                        </div>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
            </div>
        )
    }

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
                relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${dragging ? 'border-navy-900 bg-navy-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
            `}
        >
            <span className={`material-symbols-outlined text-3xl ${dragging ? 'text-navy-900' : 'text-gray-400'}`}>
                receipt_long
            </span>
            <div className="text-center">
                <p className="text-xs font-bold text-gray-500">{label}</p>
                <p className="text-[10px] text-gray-400">JPG, PNG o PDF · arrastrá o hacé click</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
        </div>
    )
}
