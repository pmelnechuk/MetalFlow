import { useState } from 'react'
import type { Bank, Entity } from '../../types/database'

interface Props {
    bank?: Bank
    entities: Entity[]
    onSave: (data: { name: string; short_name?: string; entity_id?: string }) => void
    onClose: () => void
    onDelete?: () => void
}

export function BankModal({ bank, entities, onSave, onClose, onDelete }: Props) {
    const [name, setName] = useState(bank?.name ?? '')
    const [shortName, setShortName] = useState(bank?.short_name ?? '')
    const [entityId, setEntityId] = useState(bank?.entity_id ?? '')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const canSave = name.trim()

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                        <span className="material-symbols-outlined text-2xl icon-filled">corporate_fare</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {bank ? 'Editar banco' : 'Nuevo banco'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Nombre del banco *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Banco Galicia"
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Nombre corto</label>
                        <input
                            type="text"
                            value={shortName}
                            onChange={e => setShortName(e.target.value)}
                            placeholder="Ej: Galicia"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        />
                    </div>

                    {entities.length > 0 && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Entidad (opcional)</label>
                            <select
                                value={entityId}
                                onChange={e => setEntityId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin entidad</option>
                                {entities.map(en => (
                                    <option key={en.id} value={en.id}>{en.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5 flex gap-2 border-t border-gray-100 pt-4">
                    {onDelete && (
                        confirmDelete ? (
                            <div className="flex gap-2 flex-1">
                                <button onClick={onDelete} className="flex-1 py-2.5 border-2 border-red-500 bg-red-50 text-red-700 font-bold text-sm uppercase rounded-xl hover:bg-red-100 transition-colors">
                                    Confirmar
                                </button>
                                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDelete(true)} className="py-2.5 px-4 border-2 border-red-200 text-red-500 font-bold text-sm uppercase rounded-xl hover:bg-red-50 transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )
                    )}
                    <button
                        onClick={() => canSave && onSave({ name: name.trim(), short_name: shortName.trim() || undefined, entity_id: entityId || undefined })}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        {bank ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    )
}
