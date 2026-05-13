import type { AccountWithBalance } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

const TYPE_LABEL: Record<string, string> = {
    cash: 'Efectivo',
    bank: 'Banco',
    digital: 'Digital',
}

const TYPE_ICON: Record<string, string> = {
    cash: 'payments',
    bank: 'account_balance',
    digital: 'smartphone',
}

interface Props {
    account: AccountWithBalance
    bankName?: string
    onEdit: () => void
}

export function AccountCard({ account, bankName, onEdit }: Props) {
    const isNegative = account.balance < 0
    const hasOverdraft = account.overdraft_limit > 0
    const availableWithOverdraft = account.balance + account.overdraft_limit
    const overdraftUsed = account.balance < 0 ? Math.abs(account.balance) : 0
    const overdraftPct = hasOverdraft ? Math.min(100, (overdraftUsed / account.overdraft_limit) * 100) : 0

    return (
        <div
            onClick={onEdit}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden"
        >
            {/* Entity color bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ backgroundColor: account.entity_color }}
            />

            <div className="pt-1">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl text-gray-500">{TYPE_ICON[account.type] ?? 'wallet'}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-navy-900 leading-tight">{account.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase">
                                {bankName ? `${bankName} · ` : ''}{TYPE_LABEL[account.type] ?? account.type}
                                {account.card_last4 ? ` · ···${account.card_last4}` : ''}
                            </p>
                        </div>
                    </div>
                    <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: account.entity_color + '20', color: account.entity_color }}
                    >
                        {account.entity_name}
                    </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-0.5">Saldo actual</p>
                    <p className={`text-2xl font-black ${isNegative ? 'text-red-600' : 'text-navy-900'}`}>
                        {formatCurrency(account.balance)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{account.currency}</p>
                </div>

                {/* Overdraft section */}
                {hasOverdraft && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-1">
                            <span>Descubierto {overdraftUsed > 0 ? `usado` : 'disponible'}</span>
                            <span>Límite: {formatCurrency(account.overdraft_limit)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${overdraftPct}%`,
                                    backgroundColor: overdraftPct > 80 ? '#ef4444' : '#f59e0b',
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Disponible total: <span className="font-bold text-navy-900">{formatCurrency(availableWithOverdraft)}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
