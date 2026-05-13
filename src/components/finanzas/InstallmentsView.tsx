import { useState } from 'react'
import type { UpcomingInstallment, Account } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface Props {
    installments: UpcomingInstallment[]
    accounts: Account[]
    onPayInstallment: (installment: UpcomingInstallment, accountId: string) => Promise<void>
    onPayAllMonth?: (items: UpcomingInstallment[], accountId: string) => Promise<void>
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getMonthKey(due_date: string) {
    const d = new Date(due_date + 'T00:00:00')
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key: string) {
    const [year, month] = key.split('-')
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

function groupByMonth(items: UpcomingInstallment[]) {
    const map = new Map<string, UpcomingInstallment[]>()
    for (const i of items) {
        const key = getMonthKey(i.due_date)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(i)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

interface PayModalProps {
    title: string
    subtitle: string
    amount: number
    accounts: Account[]
    paying: boolean
    onConfirm: (accountId: string) => void
    onClose: () => void
}

function PayModal({ title, subtitle, amount, accounts, paying, onConfirm, onClose }: PayModalProps) {
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-xs rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-navy-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="bg-navy-50 rounded-lg px-4 py-3 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-navy-600">Importe</span>
                        <span className="text-xl font-black text-navy-900">{formatCurrency(amount)}</span>
                    </div>
                    {accounts.length > 0 ? (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Pagar desde</label>
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No hay cuentas disponibles.</p>
                    )}
                </div>
                <div className="px-5 pb-4 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-50">Cancelar</button>
                    <button
                        onClick={() => accountId && onConfirm(accountId)}
                        disabled={!accountId || paying}
                        className="flex-1 py-2.5 bg-green-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar pago
                    </button>
                </div>
            </div>
        </div>
    )
}

export function InstallmentsView({ installments, accounts, onPayInstallment, onPayAllMonth }: Props) {
    const [payingInstallment, setPayingInstallment] = useState<UpcomingInstallment | null>(null)
    const [bulkPayItems, setBulkPayItems] = useState<UpcomingInstallment[] | null>(null)
    const [paying, setPaying] = useState(false)
    const todayStr = new Date().toISOString().split('T')[0]

    const pending = installments.filter(i => i.status !== 'pagado')
    const groups = groupByMonth(pending)

    const totalPending = pending.reduce((s, i) => s + i.amount, 0)
    const thisMonthKey = getMonthKey(todayStr)
    const thisMonthTotal = (groups.find(([k]) => k === thisMonthKey)?.[1] ?? []).reduce((s, i) => s + i.amount, 0)

    const handlePay = async (accountId: string) => {
        if (!payingInstallment) return
        setPaying(true)
        await onPayInstallment(payingInstallment, accountId)
        setPaying(false)
        setPayingInstallment(null)
    }

    const handleBulkPay = async (accountId: string) => {
        if (!bulkPayItems || !onPayAllMonth) return
        setPaying(true)
        await onPayAllMonth(bulkPayItems, accountId)
        setPaying(false)
        setBulkPayItems(null)
    }

    if (pending.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl text-green-500 icon-filled">check_circle</span>
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Sin cuotas pendientes</p>
                <p className="text-xs text-gray-400 mt-1">Los próximos 6 meses están al día</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Este mes</p>
                    <p className="text-xl font-black text-navy-900">{formatCurrency(thisMonthTotal)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Total pendiente</p>
                    <p className="text-xl font-black text-navy-900">{formatCurrency(totalPending)}</p>
                </div>
            </div>

            {/* Month groups */}
            {groups.map(([key, items]) => {
                const isCurrentMonth = key === thisMonthKey
                const monthTotal = items.reduce((s, i) => s + i.amount, 0)

                return (
                    <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className={cn(
                            'px-4 py-3 flex items-center justify-between border-b border-gray-100',
                            isCurrentMonth && 'bg-navy-900 text-white'
                        )}>
                            <span className={cn('text-sm font-bold', isCurrentMonth ? 'text-white' : 'text-navy-900')}>
                                {getMonthLabel(key)}
                                {isCurrentMonth && <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Este mes</span>}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-black', isCurrentMonth ? 'text-white' : 'text-navy-900')}>
                                    {formatCurrency(monthTotal)}
                                </span>
                                {onPayAllMonth && items.length > 1 && (
                                    <button
                                        onClick={() => setBulkPayItems(items)}
                                        className={cn(
                                            'text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg transition-colors',
                                            isCurrentMonth
                                                ? 'bg-white/20 text-white hover:bg-white/30'
                                                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                        )}
                                    >
                                        Pagar todo
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {items.map(inst => {
                                const isOverdue = inst.due_date < todayStr && inst.status !== 'pagado'
                                return (
                                    <div key={inst.id} className={cn(
                                        'px-4 py-3 flex items-center gap-3',
                                        isOverdue && 'bg-red-50'
                                    )}>
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: inst.entity_color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-navy-900 truncate">{inst.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-400">{inst.card_name}</span>
                                                <span className="text-[10px] text-gray-300">·</span>
                                                <span className="text-[10px] text-gray-400">
                                                    Cuota {inst.installment_number}/{inst.num_installments}
                                                </span>
                                                {isOverdue && (
                                                    <span className="text-[10px] font-bold text-red-600 uppercase">Vencida</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={cn('text-sm font-black', isOverdue ? 'text-red-600' : 'text-navy-900')}>
                                                {formatCurrency(inst.amount)}
                                            </span>
                                            <button
                                                onClick={() => setPayingInstallment(inst)}
                                                className="px-2.5 py-1 bg-green-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Pagar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            {payingInstallment && (
                <PayModal
                    title="Pagar cuota"
                    subtitle={`${payingInstallment.description} — cuota ${payingInstallment.installment_number}/${payingInstallment.num_installments}`}
                    amount={payingInstallment.amount}
                    accounts={accounts}
                    paying={paying}
                    onConfirm={handlePay}
                    onClose={() => !paying && setPayingInstallment(null)}
                />
            )}

            {bulkPayItems && (
                <PayModal
                    title={`Pagar resumen — ${getMonthLabel(getMonthKey(bulkPayItems[0].due_date))}`}
                    subtitle={`${bulkPayItems.length} cuotas de ${[...new Set(bulkPayItems.map(i => i.card_name))].join(', ')}`}
                    amount={bulkPayItems.reduce((s, i) => s + i.amount, 0)}
                    accounts={accounts}
                    paying={paying}
                    onConfirm={handleBulkPay}
                    onClose={() => !paying && setBulkPayItems(null)}
                />
            )}
        </div>
    )
}
