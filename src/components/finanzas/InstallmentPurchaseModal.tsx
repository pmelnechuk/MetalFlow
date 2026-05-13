import { useState, useMemo } from 'react'
import type { CreditCard, Entity, ExpenseCategory } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

interface Props {
    cards: CreditCard[]
    entities: Entity[]
    categories: ExpenseCategory[]
    projects: { id: string; name: string; client: string }[]
    purchaseId?: string
    defaultCardId?: string
    initialDescription?: string
    initialAmount?: string
    onSave: (data: {
        credit_card_id: string
        purchase_id?: string
        description: string
        total_amount: number
        num_installments: number
        first_due_date: string
        category_id?: string
        project_id?: string
    }) => void
    onClose: () => void
}

function nextDueDate(dueDay: number): string {
    const today = new Date()
    const d = new Date(today.getFullYear(), today.getMonth(), dueDay)
    if (d <= today) d.setMonth(d.getMonth() + 1)
    return d.toISOString().split('T')[0]
}

export function InstallmentPurchaseModal({
    cards, entities, categories, projects,
    purchaseId, defaultCardId, initialDescription = '', initialAmount = '',
    onSave, onClose
}: Props) {
    const activeCards = cards.filter(c => c.active)
    const [cardId, setCardId] = useState(defaultCardId ?? activeCards[0]?.id ?? '')
    const [description, setDescription] = useState(initialDescription)
    const [totalAmount, setTotalAmount] = useState(initialAmount)
    const [numInstallments, setNumInstallments] = useState('1')
    const [categoryId, setCategoryId] = useState('')
    const [projectId, setProjectId] = useState('')

    const selectedCard = activeCards.find(c => c.id === cardId)
    const firstDueDate = selectedCard ? nextDueDate(selectedCard.due_day) : ''

    const total = parseFloat(totalAmount) || 0
    const n = parseInt(numInstallments) || 1
    const installmentAmt = n > 0 ? Math.ceil((total / n) * 100) / 100 : 0

    const cardEntity = entities.find(e => e.id === selectedCard?.entity_id)

    const canSave = description.trim() && total > 0 && cardId && n >= 1

    const previewMonths = useMemo(() => {
        if (!firstDueDate || n <= 0) return []
        const base = new Date(firstDueDate + 'T00:00:00')
        return Array.from({ length: Math.min(n, 6) }, (_, i) => {
            const d = new Date(base)
            d.setMonth(d.getMonth() + i)
            return d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
        })
    }, [firstDueDate, n])

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-700">
                        <span className="material-symbols-outlined text-2xl icon-filled">add_shopping_cart</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">Compra en cuotas</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Tarjeta */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Tarjeta *</label>
                        {activeCards.length === 0 ? (
                            <p className="text-sm text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg">No hay tarjetas registradas.</p>
                        ) : (
                            <select
                                value={cardId}
                                onChange={e => setCardId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                {activeCards.map(c => {
                                    const ent = entities.find(e => e.id === c.entity_id)
                                    return <option key={c.id} value={c.id}>{c.name}{ent ? ` (${ent.name})` : ''}</option>
                                })}
                            </select>
                        )}
                        {selectedCard && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                Cierra día {selectedCard.closing_day} · Vence día {selectedCard.due_day}
                                {cardEntity && <span style={{ color: cardEntity.color }}> · {cardEntity.name}</span>}
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción *</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ej: Notebook Dell, Herramienta..."
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        />
                    </div>

                    {/* Monto + cuotas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Total *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={totalAmount}
                                    onChange={e => setTotalAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Cuotas</label>
                            <input
                                type="number"
                                value={numInstallments}
                                onChange={e => setNumInstallments(e.target.value)}
                                min="1"
                                max="60"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {total > 0 && n > 0 && (
                        <div className="bg-purple-50 rounded-xl px-4 py-3 space-y-1">
                            <div className="flex justify-between text-xs font-bold text-purple-800">
                                <span>{n}x cuotas de</span>
                                <span className="text-lg font-black">{formatCurrency(installmentAmt)}</span>
                            </div>
                            {firstDueDate && (
                                <p className="text-[10px] text-purple-600">
                                    1ª cuota: {new Date(firstDueDate + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            )}
                            {n > 1 && previewMonths.length > 0 && (
                                <p className="text-[10px] text-purple-500">{previewMonths.join(' · ')}{n > 6 ? ` · +${n - 6} más` : ''}</p>
                            )}
                        </div>
                    )}

                    {/* Categoría */}
                    {categories.length > 0 && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Categoría</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Proyecto */}
                    {projects.length > 0 && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                            <select
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin proyecto</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5 flex gap-2 border-t border-gray-100 pt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => canSave && onSave({
                            credit_card_id: cardId,
                            purchase_id: purchaseId,
                            description: description.trim(),
                            total_amount: total,
                            num_installments: n,
                            first_due_date: firstDueDate,
                            category_id: categoryId || undefined,
                            project_id: projectId || undefined,
                        })}
                        disabled={!canSave || activeCards.length === 0}
                        className="flex-1 py-2.5 bg-purple-700 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        Registrar
                    </button>
                </div>
            </div>
        </div>
    )
}
