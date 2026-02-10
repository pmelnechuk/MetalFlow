import { useState } from 'react'

interface ProjectFormProps {
    onSubmit: (data: { name: string; client: string }) => void
    onCancel: () => void
    initialData?: { name: string; client: string }
}

export function ProjectForm({ onSubmit, onCancel, initialData }: ProjectFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [client, setClient] = useState(initialData?.client || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !client.trim()) return
        onSubmit({ name: name.trim(), client: client.trim() })
    }

    return (
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight">
                    {initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h2>
                <button
                    onClick={onCancel}
                    className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center transition-all text-gray-400"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">
                        Nombre del Proyecto
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Estructura de Vigas IPN"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-semibold text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">
                        Cliente
                    </label>
                    <input
                        type="text"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="Ej: Tinglado S.A."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-semibold text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold text-sm uppercase rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || !client.trim()}
                        className="flex-1 py-3 px-4 bg-navy-900 text-white font-bold text-sm uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-xl icon-filled">check</span>
                        {initialData ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </div>
    )
}
