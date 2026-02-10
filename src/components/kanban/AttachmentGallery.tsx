import { useRef } from 'react'
import { useAttachments } from '../../hooks/useAttachments'

interface AttachmentGalleryProps {
    taskId: string
}

export function AttachmentGallery({ taskId }: AttachmentGalleryProps) {
    const { attachments, loading, uploading, uploadAttachment, deleteAttachment, getPublicUrl } = useAttachments(taskId)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        for (let i = 0; i < files.length; i++) {
            await uploadAttachment(files[i])
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const isImage = (mime: string) => mime.startsWith('image/')

    return (
        <div>
            {/* Upload button */}
            <div className="mb-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-3 border-[2px] border-dashed border-hc-accent rounded-xl bg-hc-accent-light/30 text-hc-accent font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-hc-accent-light/60 transition-colors disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-lg icon-filled">
                        {uploading ? 'hourglass_top' : 'add_photo_alternate'}
                    </span>
                    {uploading ? 'Subiendo...' : 'Agregar Foto / Archivo'}
                </button>
            </div>

            {/* Gallery */}
            {loading ? (
                <p className="text-center text-xs font-bold text-gray-400 py-4">Cargando adjuntos...</p>
            ) : attachments.length === 0 ? (
                <div className="text-center py-6">
                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">image</span>
                    <p className="text-xs font-bold text-gray-400">Sin adjuntos</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group border-[2px] border-black rounded-xl overflow-hidden bg-gray-50">
                            {isImage(att.mime_type) ? (
                                <a href={getPublicUrl(att.storage_path)} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={getPublicUrl(att.storage_path)}
                                        alt={att.filename}
                                        className="w-full h-24 object-cover hover:scale-105 transition-transform"
                                    />
                                </a>
                            ) : (
                                <a href={getPublicUrl(att.storage_path)} target="_blank" rel="noopener noreferrer"
                                    className="w-full h-24 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined text-2xl text-gray-400">description</span>
                                    <span className="text-[9px] font-bold text-gray-500 truncate px-1 max-w-full">{att.filename}</span>
                                </a>
                            )}
                            {/* Delete overlay */}
                            <button
                                onClick={(e) => { e.preventDefault(); deleteAttachment(att) }}
                                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black"
                            >
                                <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
