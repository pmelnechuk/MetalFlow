import type { Movement, MovementType } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

const TYPE_CONFIG: Record<MovementType, { label: string; icon: string; colorClass: string; bgClass: string }> = {
    gasto:          { label: 'Gasto',          icon: 'payments',          colorClass: 'text-red-600',    bgClass: 'bg-red-50' },
    ingreso:        { label: 'Ingreso',         icon: 'trending_up',       colorClass: 'text-green-600',  bgClass: 'bg-green-50' },
    compra_insumo:  { label: 'Compra insumo',   icon: 'inventory_2',       colorClass: 'text-amber-600',  bgClass: 'bg-amber-50' },
    pago_sueldo:    { label: 'Sueldo',          icon: 'badge',             colorClass: 'text-blue-600',   bgClass: 'bg-blue-50' },
    consumo_insumo: { label: 'Consumo insumo',  icon: 'remove_circle',     colorClass: 'text-orange-600', bgClass: 'bg-orange-50' },
    transferencia:  { label: 'Transferencia',   icon: 'swap_horiz',        colorClass: 'text-purple-600', bgClass: 'bg-purple-50' },
}

function formatMovementDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-')
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    return `${d} ${months[parseInt(m) - 1]} ${y}`
}

interface Props {
    movement: Movement
    onEdit: () => void
}

export function MovementCard({ movement, onEdit }: Props) {
    const cfg = TYPE_CONFIG[movement.type]
    const isPositive = movement.amount >= 0

    return (
        <div
            onClick={onEdit}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-start gap-3"
        >
            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.bgClass} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-xl icon-filled ${cfg.colorClass}`}>{cfg.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-900 truncate">
                            {movement.description || cfg.label}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{cfg.label}</span>
                            {movement.account && (
                                <span className="text-[10px] text-gray-400">· {movement.account.name}</span>
                            )}
                            {movement.project && (
                                <span className="text-[10px] text-gray-400">· {movement.project.name}</span>
                            )}
                            {movement.employee && (
                                <span className="text-[10px] text-gray-400">· {movement.employee.first_name} {movement.employee.last_name}</span>
                            )}
                            {movement.inventory_item && movement.inventory_qty != null && (
                                <span className="text-[10px] text-gray-400">· {movement.inventory_qty} {movement.inventory_item.unit} {movement.inventory_item.name}</span>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className={`text-base font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(movement.amount)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatMovementDate(movement.date)}</p>
                    </div>
                </div>

                {movement.category && (
                    <div className="mt-2 flex items-center gap-1">
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: movement.category.color + '20', color: movement.category.color }}
                        >
                            <span className="material-symbols-outlined text-[10px]">{movement.category.icon}</span>
                            {movement.category.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
