import { useState } from 'react'
import type { ExpenseCategory } from '../../types/database'
import type { ActivePurchase } from '../../hooks/useInstallments'
import { formatCurrency } from '../../lib/utils'

interface Props {
    purchases: ActivePurchase[]
    categories: ExpenseCategory[]
    onCancel: (id: string) => Promise<void>
    onUpdate: (id: string, data: { description?: string; category_id?: string | null }) => Promise<void>
}

export function ActiveInstallmentsSection({ purchases, categories, onCancel, onUpdate }: Props) {
    const [editingId, setEditingId]         = useState<string | null>(null)
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
    const [editDesc, setEditDesc]           = useState('')
    const [editCatId, setEditCatId]         = useState('')
    const [saving, setSaving]               = useState(false)

    const totalMonthly = purchases.reduce((s, p) => {
        const remaining = p.installments.filter(i => i.status !== 'pagado').length
        return remaining > 0 ? s + p.installment_amt : s
    }, 0)

    if (purchases.length === 0) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <span className="material-symbols-outlined text-xl text-gray-400">credit_card_off</span>
                <p className="text-xs text-gray-400">Sin compras activas en cuotas</p>
            </div>
        )
    }

    const startEdit = (p: ActivePurchase) => {
        setEditDesc(p.description)
        setEditCatId(p.category_id ?? '')
        setConfirmCancelId(null)
        setEditingId(p.id)
    }

    const handleSaveEdit = async (p: ActivePurchase) => {
        setSaving(true)
        await onUpdate(p.id, {
            description: editDesc.trim() || p.description,
            category_id: editCatId || null,
        })
        setSaving(false)
        setEditingId(null)
    }

    const handleCancel = async (id: string) => {
        setSaving(true)
        await onCancel(id)
        setSaving(false)
        setConfirmCancelId(null)
    }

    return (
        <div className="space-y-3">
            {totalMonthly > 0 && (
                <div className="bg-purple-50 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-purple-700 tracking-wide">Compromiso mensual</span>
                    <span className="text-lg font-black text-purple-900">{formatCurrency(totalMonthly)}/mes</span>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {purchases.map(p => {
                    const paidCount     = p.installments.filter(i => i.status === 'pagado').length
                    const remainingCount = p.num_installments - paidCount
                    const totalRemaining = remainingCount * p.installment_amt
                    const progressPct   = p.num_installments > 0 ? (paidCount / p.num_installments) * 100 : 0
                    const isEditing     = editingId === p.id
                    const isConfirming  = confirmCancelId === p.id

                    return (
                        <div key={p.id} className="px-4 py-4">
                            {/* Main row */}
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                                autoFocus
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                            />
                                            <select
                                                value={editCatId}
                                                onChange={e => setEditCatId(e.target.value)}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-navy-900 focus:border-navy-900 outline-none"
                                            >
                                                <option value="">Sin categoría</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(p)}
                                                    disabled={saving}
                                                    className="flex-1 py-1.5 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg hover:bg-navy-800 disabled:opacity-50"
                                                >
                                                    {saving ? 'Guardando…' : 'Guardar'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex-1 py-1.5 border border-gray-200 text-gray-600 font-bold text-xs uppercase rounded-lg hover:bg-gray-50"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-navy-900 truncate">{p.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[10px] text-gray-400">{p.credit_card?.name ?? '—'}</span>
                                                {p.category && (
                                                    <span
                                                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: p.category.color + '25', color: p.category.color }}
                                                    >
                                                        {p.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!isEditing && !isConfirming && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                            onClick={() => startEdit(p)}
                                            title="Editar"
                                            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(null); setConfirmCancelId(p.id) }}
                                            title="Anular"
                                            className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar */}
                            {!isEditing && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                                        <span>{paidCount}/{p.num_installments} cuotas pagadas</span>
                                        <span>{formatCurrency(p.installment_amt)}/mes · resta {formatCurrency(totalRemaining)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-purple-500 transition-all duration-500"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cancel confirmation */}
                            {isConfirming && (
                                <div className="mt-3 bg-red-50 rounded-lg px-3 py-2.5 flex items-center gap-3">
                                    <p className="text-xs text-red-700 font-medium flex-1">
                                        ¿Anular <span className="font-bold">{p.description}</span>? Las cuotas pendientes se eliminarán.
                                    </p>
                                    <button
                                        onClick={() => handleCancel(p.id)}
                                        disabled={saving}
                                        className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-700 disabled:opacity-50 shrink-0"
                                    >
                                        {saving ? '…' : 'Anular'}
                                    </button>
                                    <button
                                        onClick={() => setConfirmCancelId(null)}
                                        className="px-3 py-1.5 border border-gray-200 text-gray-600 font-bold text-xs uppercase rounded-lg hover:bg-white shrink-0"
                                    >
                                        No
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
