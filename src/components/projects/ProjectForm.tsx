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
        <>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-hc-accent rounded-lg border-2 border-black flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-white icon-filled">
                            {initialData ? 'edit' : 'create_new_folder'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-black uppercase text-black">
                        {initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                    </h2>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl text-gray-400">close</span>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-extrabold uppercase text-hc-accent block mb-2 border-l-[4px] border-hc-accent pl-2.5">
                        Nombre del Proyecto
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Estructura de Vigas IPN"
                        className="block w-full px-4 py-3.5 border-[3px] border-black rounded-xl bg-white text-lg font-bold text-black placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs font-extrabold uppercase text-hc-accent block mb-2 border-l-[4px] border-hc-accent pl-2.5">
                        Cliente
                    </label>
                    <input
                        type="text"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="Ej: Tinglado S.A."
                        className="block w-full px-4 py-3.5 border-[3px] border-black rounded-xl bg-white text-lg font-bold text-black placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-3 pt-2">
                    <button
                        type="submit"
                        disabled={!name.trim() || !client.trim()}
                        className="w-full py-4 px-4 border-[3px] border-black bg-hc-accent text-white font-black text-xl uppercase rounded-xl shadow-[4px_4px_0px_0px_#000000] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-2xl icon-filled">check_circle</span>
                        {initialData ? 'Guardar' : 'Crear Proyecto'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full py-3.5 px-4 border-[3px] border-black bg-white text-black font-black text-lg uppercase rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                        Cancelar
                    </button>
                </div>
            </form>
        </>
    )
}
