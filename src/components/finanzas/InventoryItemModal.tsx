import { useState } from 'react'
import type { InventoryItem } from '../../types/database'

const COMMON_UNITS = ['kg', 'm', 'm²', 'unidad', 'litro', 'rollo', 'varilla', 'plancha', 'par', 'caja']

interface Props {
    item?: InventoryItem
    onSave: (data: { name: string; unit: string; stock_min: number; description?: string }) => void
    onClose: () => void
    onDelete?: () => void
}

export function InventoryItemModal({ item, onSave, onClose, onDelete }: Props) {
    const [name, setName] = useState(item?.name ?? '')
    const [unit, setUnit] = useState(item?.unit ?? '')
    const [stockMin, setStockMin] = useState(item ? String(item.stock_min) : '0')
    const [description, setDescription] = useState(item?.description ?? '')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const canSave = name.trim() && unit.trim()

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-amber-600 icon-filled">inventory_2</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {item ? 'Editar ítem' : 'Nuevo ítem'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Chapa de acero 3mm"
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Unidad *</label>
                            <input
                                list="units-list"
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                placeholder="kg, m, unidad..."
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                            />
                            <datalist id="units-list">
                                {COMMON_UNITS.map(u => <option key={u} value={u} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Stock mínimo</label>
                            <input
                                type="number"
                                value={stockMin}
                                onChange={e => setStockMin(e.target.value)}
                                min="0"
                                step="0.001"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Especificaciones opcionales..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="px-6 pb-5 flex gap-2 border-t border-gray-100 pt-4">
                    {onDelete && (
                        confirmDelete ? (
                            <div className="flex gap-2 flex-1">
                                <button onClick={onDelete} className="flex-1 py-2.5 border-2 border-red-500 bg-red-50 text-red-700 font-bold text-sm uppercase rounded-xl hover:bg-red-100 transition-colors">Confirmar</button>
                                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDelete(true)} className="py-2.5 px-4 border-2 border-red-200 text-red-500 font-bold text-sm uppercase rounded-xl hover:bg-red-50 transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )
                    )}
                    <button
                        onClick={() => canSave && onSave({ name: name.trim(), unit: unit.trim(), stock_min: parseFloat(stockMin) || 0, description: description.trim() || undefined })}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        {item ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    )
}
