import type { CreditCardBalance, UpcomingInstallment } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface Props {
    card: CreditCardBalance
    installments: UpcomingInstallment[]
    onEdit: () => void
    onNewInstallmentPurchase: () => void
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function groupByMonth(installments: UpcomingInstallment[]) {
    const map = new Map<string, { label: string; total: number; items: UpcomingInstallment[] }>()
    for (const inst of installments) {
        const d = new Date(inst.due_date + 'T00:00:00')
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!map.has(key)) {
            map.set(key, { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, total: 0, items: [] })
        }
        const entry = map.get(key)!
        entry.total += inst.amount
        entry.items.push(inst)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

export function CreditCardCard({ card, installments, onEdit, onNewInstallmentPurchase }: Props) {
    const usedPct = card.credit_limit > 0 ? Math.min(100, (card.debt_used / card.credit_limit) * 100) : 0
    const barColor = usedPct > 90 ? '#ef4444' : usedPct > 70 ? '#f59e0b' : '#22c55e'
    const cardInstallments = installments.filter(i => i.credit_card_id === card.id)
    const monthGroups = groupByMonth(cardInstallments)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header bar */}
            <div
                className="h-1 w-full"
                style={{ backgroundColor: card.entity_color }}
            />

            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-purple-700 icon-filled">credit_card</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-navy-900 leading-tight">{card.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                                {card.bank_name ?? 'Sin banco'} · {card.entity_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onNewInstallmentPurchase}
                            title="Registrar compra en cuotas"
                            className="w-8 h-8 rounded-full hover:bg-purple-50 flex items-center justify-center text-purple-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                        </button>
                        <button
                            onClick={onEdit}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    </div>
                </div>

                {/* Credit bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                        <span>Utilizado</span>
                        <span>Límite: {formatCurrency(card.credit_limit)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${usedPct}%`, backgroundColor: barColor }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-sm font-black text-navy-900">{formatCurrency(card.debt_used)}</span>
                        <span className="text-xs font-bold text-green-600">Disp: {formatCurrency(card.available)}</span>
                    </div>
                </div>

                {/* Closing/due info */}
                <div className="flex gap-3 mb-4 text-[10px] font-bold uppercase text-gray-400">
                    <span>Cierra día {card.closing_day}</span>
                    <span>·</span>
                    <span>Vence día {card.due_day}</span>
                </div>

                {/* 6-month timeline */}
                {monthGroups.length > 0 && (
                    <div className="border-t border-gray-100 pt-3 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Próximas cuotas</p>
                        {monthGroups.map(([key, group]) => {
                            const isCurrentMonth = key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
                            const hasPastDue = group.items.some(i => i.due_date < todayStr && i.status !== 'pagado')
                            return (
                                <div key={key} className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs',
                                    isCurrentMonth ? 'bg-navy-50 border border-navy-200' : 'bg-gray-50',
                                    hasPastDue && 'bg-red-50 border border-red-200'
                                )}>
                                    <div className="flex items-center gap-2">
                                        {hasPastDue && (
                                            <span className="material-symbols-outlined text-sm text-red-500">warning</span>
                                        )}
                                        <span className={cn(
                                            'font-bold',
                                            isCurrentMonth ? 'text-navy-900' : 'text-gray-600',
                                            hasPastDue && 'text-red-700'
                                        )}>{group.label}</span>
                                        <span className="text-gray-400">{group.items.length} cuota{group.items.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <span className={cn(
                                        'font-black',
                                        isCurrentMonth ? 'text-navy-900' : 'text-gray-700',
                                        hasPastDue && 'text-red-700'
                                    )}>{formatCurrency(group.total)}</span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {monthGroups.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-2">Sin cuotas pendientes</p>
                )}
            </div>
        </div>
    )
}
