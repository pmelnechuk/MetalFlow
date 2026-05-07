import { useState } from 'react'
import type { Account, Entity } from '../../types/database'

interface Props {
    account?: Account & { entity_name?: string; entity_color?: string; balance?: number }
    entities: Entity[]
    onSave: (data: {
        entity_id: string
        name: string
        type: Account['type']
        initial_balance: number
        currency: string
    }) => void
    onClose: () => void
    onDelete?: () => void
    deleteError?: string
}

const ACCOUNT_TYPES: { value: Account['type']; label: string; icon: string }[] = [
    { value: 'cash',    label: 'Efectivo', icon: 'payments' },
    { value: 'bank',    label: 'Banco',    icon: 'account_balance' },
    { value: 'digital', label: 'Digital',  icon: 'smartphone' },
]

export function AccountModal({ account, entities, onSave, onClose, onDelete, deleteError }: Props) {
    const [entityId, setEntityId] = useState(account?.entity_id ?? (entities[0]?.id ?? ''))
    const [name, setName] = useState(account?.name ?? '')
    const [type, setType] = useState<Account['type']>(account?.type ?? 'cash')
    const [initialBalance, setInitialBalance] = useState(account ? String(account.initial_balance) : '0')
    const [currency, setCurrency] = useState(account?.currency ?? 'ARS')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const canSave = name.trim() && entityId

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                        <span className="material-symbols-outlined text-2xl icon-filled">account_balance</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {account ? 'Editar cuenta' : 'Nueva cuenta'}
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
                            onChange={e => setEntityId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                        >
                            {entities.map(en => (
                                <option key={en.id} value={en.id}>{en.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Caja taller, Cuenta Galicia"
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">Tipo *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {ACCOUNT_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setType(t.value)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                        type === t.value
                                            ? 'border-navy-900 bg-navy-50 text-navy-900'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${type === t.value ? 'icon-filled' : ''}`}>{t.icon}</span>
                                    <span className="text-[10px] font-bold uppercase">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Saldo inicial + Moneda */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Saldo inicial</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={initialBalance}
                                    onChange={e => setInitialBalance(e.target.value)}
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Moneda</label>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    {deleteError && (
                        <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
                    )}
                </div>

                {/* Footer */}
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
                        onClick={() => canSave && onSave({ entity_id: entityId, name: name.trim(), type, initial_balance: parseFloat(initialBalance) || 0, currency })}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        {account ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    )
}
