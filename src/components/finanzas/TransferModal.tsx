import { useState } from 'react'
import type { Account, Entity } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

interface Props {
    accounts: Account[]
    entities: Entity[]
    onSave: (data: {
        entity_id: string
        from_account_id: string
        to_account_id: string
        amount: number
        date: string
        description?: string
    }) => void
    onClose: () => void
}

export function TransferModal({ accounts, entities, onSave, onClose }: Props) {
    const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
    const [fromAccountId, setFromAccountId] = useState('')
    const [toAccountId, setToAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState('')

    const filteredAccounts = entityId ? accounts.filter(a => a.entity_id === entityId) : accounts
    const parsedAmount = parseFloat(amount) || 0
    const canSave = parsedAmount > 0 && fromAccountId && toAccountId && fromAccountId !== toAccountId

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-purple-600 icon-filled">swap_horiz</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">Transferencia</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Entidad</label>
                        <select
                            value={entityId}
                            onChange={e => { setEntityId(e.target.value); setFromAccountId(''); setToAccountId('') }}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        >
                            {entities.map(en => (
                                <option key={en.id} value={en.id}>{en.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* From → To */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Desde</label>
                            <select
                                value={fromAccountId}
                                onChange={e => setFromAccountId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná</option>
                                {filteredAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-5 text-gray-400">
                            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Hacia</label>
                            <select
                                value={toAccountId}
                                onChange={e => setToAccountId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná</option>
                                {filteredAccounts.filter(a => a.id !== fromAccountId).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Monto *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Motivo de la transferencia..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {parsedAmount > 0 && fromAccountId && toAccountId && (
                        <div className="bg-purple-50 rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-purple-600 tracking-wider">Total</span>
                            <span className="text-xl font-black text-purple-900">{formatCurrency(parsedAmount)}</span>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5 flex gap-2 border-t border-gray-100 pt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => canSave && onSave({ entity_id: entityId, from_account_id: fromAccountId, to_account_id: toAccountId, amount: parsedAmount, date, description: description.trim() || undefined })}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-purple-700 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">swap_horiz</span>
                        Transferir
                    </button>
                </div>
            </div>
        </div>
    )
}
