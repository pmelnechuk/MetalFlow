import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, exportToCSV } from '../../lib/utils'
import type { ProjectCost, AccountWithBalance, InventoryStock, CreditCardBalance, UpcomingInstallment } from '../../types/database'

type ReportTab = 'proyectos' | 'cuentas' | 'categorias' | 'inventario' | 'tarjetas' | 'compras'

interface PurchaseReportRow {
    supplier: string
    category: string
    purchase_count: number
    total_spent: number
    registered_in_finanzas: number
}

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

function ExportButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title="Exportar CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-navy-900 transition-colors text-[11px] font-bold uppercase tracking-wide"
        >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
        </button>
    )
}

export function ReportsView() {
    const [tab, setTab] = useState<ReportTab>('proyectos')
    const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([])
    const [accountBalances, setAccountBalances] = useState<AccountWithBalance[]>([])
    const [stockItems, setStockItems] = useState<InventoryStock[]>([])
    const [categoryStats, setCategoryStats] = useState<{ name: string; color: string; icon: string; total: number }[]>([])
    const [cardBalances, setCardBalances] = useState<CreditCardBalance[]>([])
    const [upcomingInstallments, setUpcomingInstallments] = useState<UpcomingInstallment[]>([])
    const [purchaseReport, setPurchaseReport] = useState<PurchaseReportRow[]>([])
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
        } else if (t === 'tarjetas') {
            const { data: cards } = await db.from('credit_card_balances').select('*').eq('active', true).order('name')
            setCardBalances((cards as CreditCardBalance[]) || [])
            const { data: inst } = await db.from('upcoming_installments').select('*').neq('status', 'pagado')
            setUpcomingInstallments((inst as UpcomingInstallment[]) || [])
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
        } else if (t === 'compras') {
            const { data: purchases } = await supabase
                .from('purchases')
                .select('id, description, quantity, unit_price, movement_id, supplier:suppliers(name, category), project:projects(name)')
                .eq('status', 'comprado')

            if (purchases) {
                const map = new Map<string, PurchaseReportRow>()
                for (const p of purchases as any[]) {
                    const supplierName = p.supplier?.name ?? 'Sin proveedor'
                    const key = supplierName
                    const spent = (p.unit_price ?? 0) * (p.quantity ?? 1)
                    const existing = map.get(key) ?? {
                        supplier: supplierName,
                        category: p.supplier?.category ?? '—',
                        purchase_count: 0,
                        total_spent: 0,
                        registered_in_finanzas: 0,
                    }
                    existing.purchase_count++
                    existing.total_spent += spent
                    if (p.movement_id) existing.registered_in_finanzas++
                    map.set(key, existing)
                }
                setPurchaseReport(Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent))
            }
        }
        setLoading(false)
    }

    // --- Export handlers ---
    function handleExport() {
        if (tab === 'proyectos') {
            exportToCSV(
                projectCosts.map(p => ({ Proyecto: p.name, Cliente: p.client, Total: p.total_cost, Materiales: p.materials_cost, ManoDeObra: p.labor_cost, Movimientos: p.movement_count })),
                'reporte_proyectos'
            )
        } else if (tab === 'cuentas') {
            exportToCSV(
                accountBalances.map(a => ({ Cuenta: a.name, Entidad: a.entity_name, Saldo: a.balance })),
                'reporte_cuentas'
            )
        } else if (tab === 'tarjetas') {
            exportToCSV(
                cardBalances.map(c => ({ Tarjeta: c.name, Banco: c.bank_name ?? '', Limite: c.credit_limit, Utilizado: c.debt_used, Disponible: c.available })),
                'reporte_tarjetas'
            )
        } else if (tab === 'categorias') {
            exportToCSV(
                categoryStats.map(c => ({ Categoria: c.name, Total: c.total })),
                `reporte_categorias_${periodFrom}_${periodTo}`
            )
        } else if (tab === 'inventario') {
            exportToCSV(
                stockItems.map(i => ({ Item: i.name, Unidad: i.unit, StockActual: i.stock_current, StockMinimo: i.stock_min })),
                'reporte_inventario'
            )
        } else if (tab === 'compras') {
            exportToCSV(
                purchaseReport.map(r => ({ Proveedor: r.supplier, Categoria: r.category, Compras: r.purchase_count, TotalGastado: r.total_spent, RegistradosEnFinanzas: r.registered_in_finanzas })),
                'reporte_compras'
            )
        }
    }

    const REPORT_TABS: { value: ReportTab; label: string; icon: string }[] = [
        { value: 'proyectos',   label: 'Proyectos',  icon: 'folder_open' },
        { value: 'cuentas',     label: 'Cuentas',    icon: 'account_balance' },
        { value: 'tarjetas',    label: 'Tarjetas',   icon: 'credit_card' },
        { value: 'categorias',  label: 'Categorías', icon: 'label' },
        { value: 'inventario',  label: 'Stock',      icon: 'inventory_2' },
        { value: 'compras',     label: 'Compras',    icon: 'shopping_cart' },
    ]

    const totalCosts = projectCosts.reduce((s, p) => s + p.total_cost, 0)
    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0)
    const totalPurchaseSpend = purchaseReport.reduce((s, r) => s + r.total_spent, 0)

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
                                    <div className="flex items-center gap-3">
                                        <SectionTitle>Costo por proyecto</SectionTitle>
                                        <span className="text-xs font-black text-red-600">{formatCurrency(totalCosts)} total</span>
                                    </div>
                                    <ExportButton onClick={handleExport} />
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
                                    <div className="flex items-center gap-3">
                                        <SectionTitle>Saldo por cuenta</SectionTitle>
                                        <span className={`text-xs font-black ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(totalBalance)} total
                                        </span>
                                    </div>
                                    <ExportButton onClick={handleExport} />
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

                        {/* TARJETAS */}
                        {tab === 'tarjetas' && (() => {
                            const totalDebt = cardBalances.reduce((s, c) => s + c.debt_used, 0)
                            const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                            const monthMap = new Map<string, number>()
                            for (const inst of upcomingInstallments) {
                                const d = new Date(inst.due_date + 'T00:00:00')
                                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                                monthMap.set(key, (monthMap.get(key) ?? 0) + inst.amount)
                            }
                            const monthGroups = Array.from(monthMap.entries()).sort(([a],[b]) => a.localeCompare(b))
                            return (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <SectionTitle>Deuda por tarjeta</SectionTitle>
                                            <span className="text-xs font-black text-red-600">{formatCurrency(totalDebt)} total</span>
                                        </div>
                                        <ExportButton onClick={handleExport} />
                                    </div>
                                    {cardBalances.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">Sin tarjetas de crédito</p>
                                    ) : cardBalances.map(c => (
                                        <div key={c.id} className="py-3 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="text-sm font-bold text-navy-900">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400">{c.bank_name ?? 'Sin banco'} · Límite {formatCurrency(c.credit_limit)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-red-600">{formatCurrency(c.debt_used)}</p>
                                                    <p className="text-[10px] text-green-600">Disp: {formatCurrency(c.available)}</p>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-red-500 transition-all"
                                                    style={{ width: `${Math.min(100, c.credit_limit > 0 ? (c.debt_used / c.credit_limit) * 100 : 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {monthGroups.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <SectionTitle>Cuotas por vencer (6 meses)</SectionTitle>
                                            {monthGroups.map(([key, total]) => {
                                                const [year, month] = key.split('-')
                                                const isNow = key === `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`
                                                return (
                                                    <div key={key} className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${isNow ? 'font-bold' : ''}`}>
                                                        <span className={`text-sm ${isNow ? 'text-navy-900 font-black' : 'text-gray-600 font-medium'}`}>
                                                            {MONTHS[parseInt(month)-1]} {year}{isNow ? ' ← este mes' : ''}
                                                        </span>
                                                        <span className={`text-sm font-black ${isNow ? 'text-red-700' : 'text-gray-700'}`}>{formatCurrency(total)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {/* CATEGORÍAS */}
                        {tab === 'categorias' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle>Egresos por categoría</SectionTitle>
                                    <ExportButton onClick={handleExport} />
                                </div>
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
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle>Estado de stock</SectionTitle>
                                    <ExportButton onClick={handleExport} />
                                </div>
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

                        {/* COMPRAS */}
                        {tab === 'compras' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <SectionTitle>Gasto por proveedor</SectionTitle>
                                        {totalPurchaseSpend > 0 && (
                                            <span className="text-xs font-black text-red-600">{formatCurrency(totalPurchaseSpend)} total</span>
                                        )}
                                    </div>
                                    <ExportButton onClick={handleExport} />
                                </div>
                                {purchaseReport.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Sin compras registradas</p>
                                ) : purchaseReport.map(r => (
                                    <div key={r.supplier} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-navy-900">{r.supplier}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-gray-400">{r.category} · {r.purchase_count} compra{r.purchase_count !== 1 ? 's' : ''}</p>
                                                {r.registered_in_finanzas > 0 && (
                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                                        <span className="material-symbols-outlined text-[10px]">link</span>
                                                        {r.registered_in_finanzas}/{r.purchase_count} en finanzas
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-red-600">{formatCurrency(r.total_spent)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
