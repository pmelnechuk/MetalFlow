import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import type { ProjectCost, AccountWithBalance, InventoryStock } from '../../types/database'

type ReportTab = 'proyectos' | 'cuentas' | 'categorias' | 'inventario'

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">{children}</h3>
}

function StatRow({ label, sublabel, value, subvalue, color }: { label: string; sublabel?: string; value: string; subvalue?: string; color?: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
                <p className="text-sm font-bold text-navy-900">{label}</p>
                {sublabel && <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>}
            </div>
            <div className="text-right">
                <p className={`text-sm font-black ${color ?? 'text-navy-900'}`}>{value}</p>
                {subvalue && <p className="text-[10px] text-gray-400 mt-0.5">{subvalue}</p>}
            </div>
        </div>
    )
}

export function ReportsView() {
    const [tab, setTab] = useState<ReportTab>('proyectos')
    const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([])
    const [accountBalances, setAccountBalances] = useState<AccountWithBalance[]>([])
    const [stockItems, setStockItems] = useState<InventoryStock[]>([])
    const [categoryStats, setCategoryStats] = useState<{ name: string; color: string; icon: string; total: number }[]>([])
    const [loading, setLoading] = useState(false)

    const [periodFrom, setPeriodFrom] = useState(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    })
    const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split('T')[0])

    useEffect(() => {
        loadReport(tab)
    }, [tab, periodFrom, periodTo]) // eslint-disable-line react-hooks/exhaustive-deps

    async function loadReport(t: ReportTab) {
        setLoading(true)
        const db = supabase as any
        if (t === 'proyectos') {
            const { data } = await db.from('project_costs').select('*').order('total_cost', { ascending: false })
            setProjectCosts((data as ProjectCost[]) || [])
        } else if (t === 'cuentas') {
            const { data } = await db.from('account_balances').select('*').eq('active', true).order('entity_name')
            setAccountBalances((data as AccountWithBalance[]) || [])
        } else if (t === 'inventario') {
            const { data } = await db.from('inventory_stock').select('*').order('name')
            setStockItems((data as InventoryStock[]) || [])
        } else if (t === 'categorias') {
            const { data } = await supabase
                .from('movements')
                .select('amount, category:expense_categories(id, name, color, icon)')
                .neq('type', 'ingreso')
                .gte('date', periodFrom)
                .lte('date', periodTo)

            if (data) {
                const map = new Map<string, { name: string; color: string; icon: string; total: number }>()
                for (const m of data as any[]) {
                    const cat = m.category
                    const key = cat ? cat.id : '__sin_categoria__'
                    const label = cat ? cat.name : 'Sin categoría'
                    const color = cat?.color ?? '#6b7280'
                    const icon = cat?.icon ?? 'label'
                    const existing = map.get(key) ?? { name: label, color, icon, total: 0 }
                    existing.total += Math.abs(m.amount)
                    map.set(key, existing)
                }
                setCategoryStats(Array.from(map.values()).sort((a, b) => b.total - a.total))
            }
        }
        setLoading(false)
    }

    const REPORT_TABS: { value: ReportTab; label: string; icon: string }[] = [
        { value: 'proyectos',   label: 'Proyectos',  icon: 'folder_open' },
        { value: 'cuentas',     label: 'Cuentas',    icon: 'account_balance' },
        { value: 'categorias',  label: 'Categorías', icon: 'label' },
        { value: 'inventario',  label: 'Stock',      icon: 'inventory_2' },
    ]

    const totalCosts = projectCosts.reduce((s, p) => s + p.total_cost, 0)
    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0)

    return (
        <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {REPORT_TABS.map(t => (
                    <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                            tab === t.value ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-900'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Period filter (only for categories) */}
            {tab === 'categorias' && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-xs font-bold uppercase text-gray-500 shrink-0">Período</span>
                    <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)}
                        className="flex-1 text-xs font-bold text-navy-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-navy-900" />
                    <span className="text-gray-400 text-xs">→</span>
                    <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)}
                        className="flex-1 text-xs font-bold text-navy-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-navy-900" />
                </div>
            )}

            {loading ? (
                <div className="space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4">
                        {/* PROYECTOS */}
                        {tab === 'proyectos' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle>Costo por proyecto</SectionTitle>
                                    <span className="text-xs font-black text-red-600">{formatCurrency(totalCosts)} total</span>
                                </div>
                                {projectCosts.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Sin movimientos por proyecto</p>
                                ) : projectCosts.map(p => (
                                    <StatRow
                                        key={p.id}
                                        label={p.name}
                                        sublabel={`${p.client} · ${p.movement_count} mov.`}
                                        value={formatCurrency(p.total_cost)}
                                        subvalue={p.materials_cost > 0 ? `Mat: ${formatCurrency(p.materials_cost)}` : undefined}
                                        color="text-red-600"
                                    />
                                ))}
                            </>
                        )}

                        {/* CUENTAS */}
                        {tab === 'cuentas' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle>Saldo por cuenta</SectionTitle>
                                    <span className={`text-xs font-black ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(totalBalance)} total
                                    </span>
                                </div>
                                {accountBalances.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Sin cuentas</p>
                                ) : accountBalances.map(a => (
                                    <StatRow
                                        key={a.id}
                                        label={a.name}
                                        sublabel={a.entity_name}
                                        value={formatCurrency(a.balance)}
                                        color={a.balance >= 0 ? 'text-green-600' : 'text-red-600'}
                                    />
                                ))}
                            </>
                        )}

                        {/* CATEGORÍAS */}
                        {tab === 'categorias' && (
                            <>
                                <SectionTitle>Egresos por categoría</SectionTitle>
                                {categoryStats.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Sin egresos en el período</p>
                                ) : categoryStats.map(c => (
                                    <div key={c.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                                                <span className="material-symbols-outlined text-sm" style={{ color: c.color }}>{c.icon}</span>
                                            </div>
                                            <span className="text-sm font-bold text-navy-900">{c.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-red-600">{formatCurrency(c.total)}</span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* INVENTARIO */}
                        {tab === 'inventario' && (
                            <>
                                <SectionTitle>Estado de stock</SectionTitle>
                                {stockItems.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Sin ítems de inventario</p>
                                ) : stockItems.map(i => {
                                    const isEmpty = i.stock_current <= 0
                                    const isLow = !isEmpty && i.stock_current <= i.stock_min && i.stock_min > 0
                                    return (
                                        <div key={i.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="text-sm font-bold text-navy-900">{i.name}</p>
                                                {i.stock_min > 0 && (
                                                    <p className="text-[10px] text-gray-400">Mín: {i.stock_min} {i.unit}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                                                    {i.stock_current % 1 === 0 ? i.stock_current.toFixed(0) : i.stock_current.toFixed(2)} {i.unit}
                                                </p>
                                                <span className={`text-[10px] font-bold uppercase ${isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-green-500'}`}>
                                                    {isEmpty ? 'Sin stock' : isLow ? 'Bajo' : 'OK'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
