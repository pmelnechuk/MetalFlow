import { formatCurrency, formatDate } from '../../lib/utils'
import type { SupplierWithStats } from '../../types/database'

const CATEGORY_LABELS: Record<string, string> = {
    materiales: 'Materiales',
    herramientas: 'Herramientas',
    servicios: 'Servicios',
    transporte: 'Transporte',
    otro: 'Otro',
}

interface Props {
    supplier: SupplierWithStats
    onEdit: () => void
    onViewPurchases: () => void
}

export function SupplierCard({ supplier, onEdit, onViewPurchases }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            {/* Accent top bar */}
            <div className="h-1 bg-navy-900" />

            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-navy-900 truncate leading-tight">{supplier.name}</h3>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            {CATEGORY_LABELS[supplier.category] || supplier.category}
                        </span>
                    </div>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy-900 transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                </div>

                {/* Total */}
                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-0.5">Total gastado</p>
                    <p className="text-2xl font-black text-navy-900 leading-none">
                        {formatCurrency(supplier.total_spent)}
                    </p>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 mb-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Compras</p>
                        <p className="text-sm font-bold text-navy-700">{supplier.purchase_count}</p>
                    </div>
                    {supplier.last_purchase_date && (
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Última</p>
                            <p className="text-sm font-bold text-navy-700">{formatDate(supplier.last_purchase_date)}</p>
                        </div>
                    )}
                    {supplier.phone && (
                        <div className="ml-auto">
                            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Tel</p>
                            <p className="text-sm font-medium text-gray-600">{supplier.phone}</p>
                        </div>
                    )}
                </div>

                {/* Ver compras */}
                <button
                    onClick={onViewPurchases}
                    className="mt-auto w-full py-2 border-2 border-navy-900 text-navy-900 font-bold text-xs uppercase rounded-lg hover:bg-navy-50 transition-colors flex items-center justify-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    Ver Compras
                </button>
            </div>
        </div>
    )
}
