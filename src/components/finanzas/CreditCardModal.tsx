import { useState } from 'react'
import type { CreditCard, Entity, Bank } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

interface Props {
    card?: CreditCard
    entities: Entity[]
    banks: Bank[]
    onSave: (data: Omit<CreditCard, 'id' | 'created_at'>) => void
    onClose: () => void
    onDelete?: () => void
}

const CARD_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Cabal', 'Naranja']

export function CreditCardModal({ card, entities, banks, onSave, onClose, onDelete }: Props) {
    const [entityId, setEntityId] = useState(card?.entity_id ?? (entities[0]?.id ?? ''))
    const [bankId, setBankId] = useState(card?.bank_id ?? '')
    const [name, setName] = useState(card?.name ?? '')
    const [creditLimit, setCreditLimit] = useState(card ? String(card.credit_limit) : '')
    const [closingDay, setClosingDay] = useState(card ? String(card.closing_day) : '1')
    const [dueDay, setDueDay] = useState(card ? String(card.due_day) : '10')
    const [currency, setCurrency] = useState(card?.currency ?? 'ARS')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const filteredBanks = banks.filter(b => !entityId || !b.entity_id || b.entity_id === entityId)
    const canSave = name.trim() && entityId && Number(creditLimit) > 0

    const handleSave = () => {
        if (!canSave) return
        onSave({
            entity_id: entityId,
            bank_id: bankId || null,
            name: name.trim(),
            credit_limit: parseFloat(creditLimit),
            closing_day: parseInt(closingDay) || 1,
            due_day: parseInt(dueDay) || 10,
            currency,
            active: true,
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-700">
                        <span className="material-symbols-outlined text-2xl icon-filled">credit_card</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {card ? 'Editar tarjeta' : 'Nueva tarjeta'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Entidad */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Entidad *</label>
                        <select
                            value={entityId}
                            onChange={e => { setEntityId(e.target.value); setBankId('') }}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        >
                            {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                        </select>
                    </div>

                    {/* Banco */}
                    {filteredBanks.length > 0 && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Banco emisor</label>
                            <select
                                value={bankId}
                                onChange={e => setBankId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin banco</option>
                                {filteredBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Nombre de la tarjeta *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Visa Galicia Oro"
                            list="card-brands"
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        />
                        <datalist id="card-brands">
                            {CARD_BRANDS.map(b => <option key={b} value={b} />)}
                        </datalist>
                    </div>

                    {/* Límite */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Límite de crédito *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                            <input
                                type="number"
                                value={creditLimit}
                                onChange={e => setCreditLimit(e.target.value)}
                                placeholder="0"
                                step="100"
                                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                        {Number(creditLimit) > 0 && (
                            <p className="text-xs text-gray-400 mt-1">{formatCurrency(Number(creditLimit))} {currency}</p>
                        )}
                    </div>

                    {/* Días cierre / vencimiento */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Día de cierre</label>
                            <input
                                type="number"
                                min={1} max={31}
                                value={closingDay}
                                onChange={e => setClosingDay(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Día de vencimiento</label>
                            <input
                                type="number"
                                min={1} max={31}
                                value={dueDay}
                                onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    {/* Moneda */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Moneda</label>
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
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
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        {card ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    )
}
