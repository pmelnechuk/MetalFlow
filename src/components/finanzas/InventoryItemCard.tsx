import type { InventoryStock } from '../../types/database'

interface Props {
    item: InventoryStock
    onEdit: () => void
}

export function InventoryItemCard({ item, onEdit }: Props) {
    const isLow = item.stock_current <= item.stock_min && item.stock_min > 0
    const isEmpty = item.stock_current <= 0

    return (
        <div
            onClick={onEdit}
            className={`bg-white rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${
                isEmpty ? 'border-red-200' : isLow ? 'border-amber-200' : 'border-gray-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isEmpty ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-gray-100'
                        }`}>
                            <span className={`material-symbols-outlined text-base ${
                                isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-500'
                            }`}>inventory_2</span>
                        </div>
                        <p className="text-sm font-bold text-navy-900 truncate">{item.name}</p>
                    </div>
                    {item.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{item.description}</p>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <p className={`text-xl font-black ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-navy-900'}`}>
                        {item.stock_current % 1 === 0
                            ? item.stock_current.toFixed(0)
                            : item.stock_current.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">{item.unit}</p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                {item.stock_min > 0 && (
                    <span className="text-[10px] text-gray-400">
                        Mín: {item.stock_min} {item.unit}
                    </span>
                )}
                {isEmpty ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 ml-auto">Sin stock</span>
                ) : isLow ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 ml-auto">Stock bajo</span>
                ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 ml-auto">OK</span>
                )}
            </div>
        </div>
    )
}
