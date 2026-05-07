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
    onEdit: () => void
}

export function AccountCard({ account, onEdit }: Props) {
    const isNegative = account.balance < 0

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
                            <p className="text-[10px] text-gray-400 font-medium uppercase">{TYPE_LABEL[account.type] ?? account.type}</p>
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
            </div>
        </div>
    )
}
