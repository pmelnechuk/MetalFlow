import { useState } from 'react'
import type { Purchase } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

interface Props {
    purchase: Purchase
    onConfirm: (unit_price: number) => void
    onClose: () => void
}

export function BuyModal({ purchase, onConfirm, onClose }: Props) {
    const [unitPrice, setUnitPrice] = useState('')

    const price = parseFloat(unitPrice) || 0
    const total = price * (purchase.quantity ?? 1)

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
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(price)}
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
