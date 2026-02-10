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
            <div className="mb-4">
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
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-300 hover:text-navy-900 transition-all disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-xl icon-filled">
                        {uploading ? 'hourglass_top' : 'add_photo_alternate'}
                    </span>
                    {uploading ? 'Subiendo...' : 'Agregar Foto / Archivo'}
                </button>
            </div>

            {/* Gallery */}
            {loading ? (
                <p className="text-center text-sm font-medium text-gray-400 py-6">Cargando adjuntos...</p>
            ) : attachments.length === 0 ? (
                <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">image_not_supported</span>
                    <p className="text-sm font-medium text-gray-400">Sin adjuntos</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow aspect-square">
                            {isImage(att.mime_type) ? (
                                <a href={getPublicUrl(att.storage_path)} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                    <img
                                        src={getPublicUrl(att.storage_path)}
                                        alt={att.filename}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </a>
                            ) : (
                                <a href={getPublicUrl(att.storage_path)} target="_blank" rel="noopener noreferrer"
                                    className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 hover:bg-gray-50 transition-colors">
                                    <span className="material-symbols-outlined text-3xl text-gray-400">description</span>
                                    <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-2 w-full px-1">{att.filename}</span>
                                </a>
                            )}

                            {/* Delete overlay */}
                            <button
                                onClick={(e) => { e.preventDefault(); deleteAttachment(att) }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-red-500 hover:text-red-700 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                                title="Eliminar"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
