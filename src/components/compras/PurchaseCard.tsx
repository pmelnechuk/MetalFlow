import { cn, formatCurrency, formatDate } from '../../lib/utils'
import type { Purchase } from '../../types/database'

const STATUS_STYLES = {
    pendiente: { badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Pendiente' },
    comprado:  { badge: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Comprado' },
    cancelado: { badge: 'bg-gray-100 text-gray-500 border border-gray-200', dot: 'bg-gray-400', label: 'Cancelado' },
}

interface Props {
    purchase: Purchase
    onEdit: () => void
    onMarkBought: () => void
    onDelete: () => void
}

export function PurchaseCard({ purchase, onEdit, onMarkBought, onDelete }: Props) {
    const styles = STATUS_STYLES[purchase.status]
    const total = purchase.unit_price != null ? purchase.unit_price * (purchase.quantity ?? 1) : null
    const isCancelled = purchase.status === 'cancelado'
    const isBought = purchase.status === 'comprado'

    return (
        <div className={cn(
            'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col',
            isCancelled && 'opacity-60',
        )}>
            {/* Status accent bar */}
            <div className={cn('h-1', isBought ? 'bg-green-500' : isCancelled ? 'bg-gray-300' : 'bg-amber-400')} />

            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-bold text-navy-900 leading-snug', isBought && 'line-through text-gray-500')}>
                            {purchase.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {purchase.quantity} {purchase.unit || 'u'}
                            {purchase.unit_price != null && (
                                <span className="text-gray-400"> · {formatCurrency(purchase.unit_price)}/u</span>
                            )}
                        </p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide', styles.badge)}>
                        {styles.label}
                    </span>
                </div>

                {/* Meta: supplier + project */}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-gray-400">storefront</span>
                        <span className="text-xs font-medium text-gray-600">
                            {(purchase.supplier as any)?.name || <span className="text-gray-400 italic">Sin proveedor</span>}
                        </span>
                    </div>
                    {purchase.project_id && (
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-gray-400">folder_open</span>
                            <span className="text-xs font-medium text-gray-600">
                                {(purchase.project as any)?.client || ''}
                            </span>
                        </div>
                    )}
                    {purchase.date_purchased && (
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-gray-400">event</span>
                            <span className="text-xs font-medium text-gray-600">{formatDate(purchase.date_purchased)}</span>
                        </div>
                    )}
                </div>

                {purchase.notes && (
                    <p className="text-xs text-gray-500 italic line-clamp-1">{purchase.notes}</p>
                )}

                {/* Total (when bought) */}
                {total != null && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-green-700 tracking-wide">Total</span>
                        <span className="text-base font-black text-green-800">{formatCurrency(total)}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                    {!isBought && !isCancelled && (
                        <button
                            onClick={onMarkBought}
                            className="flex-1 py-2 bg-green-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-base icon-filled">shopping_bag</span>
                            Comprar
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        className="py-2 px-3 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-navy-900 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                        onClick={onDelete}
                        className="py-2 px-3 border border-red-100 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
