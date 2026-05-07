import { useState } from 'react'
import type { Purchase, Account, InventoryItem } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

interface Props {
    purchase: Purchase
    accounts: Account[]
    inventoryItems: InventoryItem[]
    onConfirm: (unit_price: number, movementData?: {
        account_id: string
        entity_id: string
        inventory_item_id?: string
        inventory_qty?: number
    }) => void
    onClose: () => void
}

export function BuyModal({ purchase, accounts, inventoryItems, onConfirm, onClose }: Props) {
    const [unitPrice, setUnitPrice] = useState('')
    const [registerMovement, setRegisterMovement] = useState(accounts.length > 0)
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
    const [inventoryItemId, setInventoryItemId] = useState('')
    const [inventoryQty, setInventoryQty] = useState(String(purchase.quantity ?? 1))

    const price = parseFloat(unitPrice) || 0
    const total = price * (purchase.quantity ?? 1)
    const selectedAccount = accounts.find(a => a.id === accountId)

    const handleConfirm = () => {
        if (price <= 0) return
        onConfirm(
            price,
            registerMovement && accountId && selectedAccount
                ? {
                    account_id: accountId,
                    entity_id: selectedAccount.entity_id,
                    inventory_item_id: inventoryItemId || undefined,
                    inventory_qty: inventoryItemId && inventoryQty ? parseFloat(inventoryQty) : undefined,
                }
                : undefined
        )
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-green-600 icon-filled">shopping_bag</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-navy-900 uppercase tracking-tight">Registrar Compra</h2>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{purchase.description}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Qty info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
                        <span className="material-symbols-outlined text-base text-gray-400">package_2</span>
                        <span className="font-medium">
                            Cantidad: <span className="font-bold text-navy-900">
                                {purchase.quantity} {purchase.unit || 'u'}
                            </span>
                        </span>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Precio unitario *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                            <input
                                type="number"
                                value={unitPrice}
                                onChange={e => setUnitPrice(e.target.value)}
                                placeholder="0,00"
                                min="0"
                                step="0.01"
                                autoFocus
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Total preview */}
                    <div className="bg-navy-50 rounded-lg px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-navy-600 tracking-wider">Total</span>
                        <span className="text-xl font-black text-navy-900">{formatCurrency(total)}</span>
                    </div>

                    {/* Register as movement */}
                    {accounts.length > 0 && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setRegisterMovement(v => !v)}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-navy-900 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-navy-600">account_balance_wallet</span>
                                    Registrar en finanzas
                                </div>
                                <div className={`w-10 h-5 rounded-full transition-colors relative ${registerMovement ? 'bg-navy-900' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-all ${registerMovement ? 'right-0.5' : 'left-0.5'}`} />
                                </div>
                            </button>

                            {registerMovement && (
                                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 bg-gray-50">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-wide">Cuenta</label>
                                        <select
                                            value={accountId}
                                            onChange={e => setAccountId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            {accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-wide">Ítem inventario</label>
                                            <select
                                                value={inventoryItemId}
                                                onChange={e => setInventoryItemId(e.target.value)}
                                                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                            >
                                                <option value="">Sin ítem</option>
                                                {inventoryItems.map(i => (
                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {inventoryItemId && (
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-wide">Cantidad</label>
                                                <input
                                                    type="number"
                                                    value={inventoryQty}
                                                    onChange={e => setInventoryQty(e.target.value)}
                                                    min="0"
                                                    step="0.001"
                                                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!unitPrice || price <= 0}
                        className="flex-1 py-2.5 bg-green-600 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}
