import { useState, useEffect } from 'react'
import type { Purchase, Supplier } from '../../types/database'
import { SupplierModal } from './SupplierModal'

interface Props {
    purchase?: Purchase
    suppliers: Supplier[]
    onSave: (data: {
        description: string
        quantity: number
        unit?: string
        supplier_id?: string
        project_id?: string
        notes?: string
    }) => void
    onClose: () => void
    onDelete?: () => void
    onCreateSupplier: (data: { name: string; category: string; phone?: string; notes?: string }) => Promise<Supplier | null>
    projects: { id: string; name: string; client: string }[]
}

export function PurchaseModal({ purchase, suppliers, onSave, onClose, onDelete, onCreateSupplier, projects }: Props) {
    const [description, setDescription] = useState(purchase?.description || '')
    const [quantity, setQuantity] = useState(String(purchase?.quantity ?? 1))
    const [unit, setUnit] = useState(purchase?.unit || '')
    const [supplierId, setSupplierId] = useState(purchase?.supplier_id || '')
    const [projectId, setProjectId] = useState(purchase?.project_id || '')
    const [notes, setNotes] = useState(purchase?.notes || '')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [showNewSupplier, setShowNewSupplier] = useState(false)
    const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers)

    useEffect(() => { setSupplierList(suppliers) }, [suppliers])

    const handleSave = () => {
        if (!description.trim()) return
        onSave({
            description: description.trim(),
            quantity: parseFloat(quantity) || 1,
            unit: unit.trim() || undefined,
            supplier_id: supplierId || undefined,
            project_id: projectId || undefined,
            notes: notes.trim() || undefined,
        })
    }

    const handleCreateSupplier = async (data: { name: string; category: string; phone?: string; notes?: string }) => {
        const created = await onCreateSupplier(data)
        if (created) {
            setSupplierList(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setSupplierId(created.id)
        }
        setShowNewSupplier(false)
    }

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 shrink-0">
                        <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                            <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                        </div>
                        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                            {purchase ? 'Editar Ítem' : 'Agregar Ítem a Comprar'}
                        </h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción *</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej: Chapa de acero 3mm"
                                autoFocus
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Cantidad</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    min="0.001"
                                    step="0.001"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                                />
                            </div>
                            <div className="w-28">
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Unidad</label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                    placeholder="kg, m, u…"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proveedor</label>
                            <div className="flex gap-2">
                                <select
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                >
                                    <option value="">Sin proveedor</option>
                                    {supplierList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowNewSupplier(true)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-navy-900 hover:bg-gray-50 transition-colors font-bold text-sm"
                                    title="Crear nuevo proveedor"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                            <select
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin proyecto</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Notas</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Especificaciones, urgencia, etc."
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all resize-none placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5 shrink-0 flex gap-2 border-t border-gray-100 pt-4">
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
                            onClick={handleSave}
                            disabled={!description.trim()}
                            className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                            {purchase ? 'Guardar' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline supplier creation */}
            {showNewSupplier && (
                <div className="fixed inset-0 z-[60]">
                    <SupplierModal
                        onSave={handleCreateSupplier}
                        onClose={() => setShowNewSupplier(false)}
                    />
                </div>
            )}
        </>
    )
}
