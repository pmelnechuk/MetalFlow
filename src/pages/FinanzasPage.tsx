import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { MovementCard } from '../components/finanzas/MovementCard'
import { MovementModal } from '../components/finanzas/MovementModal'
import { AccountCard } from '../components/finanzas/AccountCard'
import { AccountModal } from '../components/finanzas/AccountModal'
import { InventoryItemCard } from '../components/finanzas/InventoryItemCard'
import { InventoryItemModal } from '../components/finanzas/InventoryItemModal'
import { TransferModal } from '../components/finanzas/TransferModal'
import { ReportsView } from '../components/finanzas/ReportsView'
import { useMovements } from '../hooks/useMovements'
import { useAccounts } from '../hooks/useAccounts'
import { useInventory } from '../hooks/useInventory'
import { useEntities } from '../hooks/useEntities'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { useEmployees } from '../hooks/useEmployees'
import { useProjects } from '../hooks/useProjects'
import { cn, formatCurrency } from '../lib/utils'
import type {
    Movement, MovementType,
    AccountWithBalance,
    InventoryStock,
} from '../types/database'

type Tab = 'movimientos' | 'inventario' | 'cuentas' | 'reportes'

const TYPE_FILTERS: { value: MovementType | 'todos'; label: string }[] = [
    { value: 'todos',          label: 'Todos' },
    { value: 'gasto',          label: 'Gastos' },
    { value: 'ingreso',        label: 'Ingresos' },
    { value: 'compra_insumo',  label: 'Insumos' },
    { value: 'pago_sueldo',    label: 'Sueldos' },
    { value: 'consumo_insumo', label: 'Consumos' },
    { value: 'transferencia',  label: 'Transferencias' },
]

export function FinanzasPage() {
    const [activeTab, setActiveTab] = useState<Tab>('movimientos')

    const { movements, loading: movementsLoading, filters, setFilters, createMovement, createTransfer, updateMovement, deleteMovement } = useMovements()
    const { accounts, loading: accountsLoading, getAccountsWithBalance, createAccount, updateAccount, deleteAccount } = useAccounts()
    const { items: inventoryItems, loading: inventoryLoading, getStock, createItem, updateItem, deleteItem } = useInventory()
    const { entities } = useEntities()
    const { categories } = useExpenseCategories()
    const { employees } = useEmployees()
    const { allProjects } = useProjects()

    const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([])
    const [stockItems, setStockItems] = useState<InventoryStock[]>([])
    const [projects, setProjects] = useState<{ id: string; name: string; client: string; status: string | null }[]>([])

    // Modals state
    const [showMovementModal, setShowMovementModal] = useState(false)
    const [editMovement, setEditMovement] = useState<Movement | null>(null)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showAccountModal, setShowAccountModal] = useState(false)
    const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null)
    const [accountDeleteError, setAccountDeleteError] = useState('')
    const [showItemModal, setShowItemModal] = useState(false)
    const [editItem, setEditItem] = useState<InventoryStock | null>(null)

    const loadAccountsWithBalance = useCallback(async () => {
        const data = await getAccountsWithBalance()
        setAccountsWithBalance(data)
    }, [getAccountsWithBalance])

    const loadStock = useCallback(async () => {
        const data = await getStock()
        setStockItems(data)
    }, [getStock])

    useEffect(() => {
        allProjects().then(setProjects)
    }, [allProjects])

    useEffect(() => {
        if (activeTab === 'cuentas') loadAccountsWithBalance()
    }, [activeTab, loadAccountsWithBalance])

    useEffect(() => {
        if (activeTab === 'inventario') loadStock()
    }, [activeTab, loadStock])

    // ── Movement handlers ──────────────────────────────────────────────────────
    const handleSaveMovement = async (data: Parameters<typeof createMovement>[0]) => {
        if (editMovement) {
            await updateMovement(editMovement.id, {
                amount: data.amount,
                date: data.date,
                description: data.description,
                category_id: data.category_id,
                project_id: data.project_id,
                employee_id: data.employee_id,
                inventory_item_id: data.inventory_item_id,
                inventory_qty: data.inventory_qty,
            })
        } else {
            await createMovement(data)
        }
        setShowMovementModal(false)
        setEditMovement(null)
        if (activeTab === 'inventario') loadStock()
    }

    const handleDeleteMovement = async () => {
        if (!editMovement) return
        await deleteMovement(editMovement.id)
        setShowMovementModal(false)
        setEditMovement(null)
        if (activeTab === 'inventario') loadStock()
        if (activeTab === 'cuentas') loadAccountsWithBalance()
    }

    const handleSaveTransfer = async (data: Parameters<typeof createTransfer>[0]) => {
        await createTransfer(data)
        setShowTransferModal(false)
        if (activeTab === 'cuentas') loadAccountsWithBalance()
    }

    // ── Account handlers ───────────────────────────────────────────────────────
    const handleSaveAccount = async (data: Parameters<typeof createAccount>[0]) => {
        if (editAccount) {
            await updateAccount(editAccount.id, { name: data.name, type: data.type, initial_balance: data.initial_balance })
        } else {
            await createAccount(data)
        }
        setShowAccountModal(false)
        setEditAccount(null)
        setAccountDeleteError('')
        loadAccountsWithBalance()
    }

    const handleDeleteAccount = async () => {
        if (!editAccount) return
        const result = await deleteAccount(editAccount.id)
        if (!result.ok) {
            setAccountDeleteError(result.error || 'Error al eliminar.')
        } else {
            setShowAccountModal(false)
            setEditAccount(null)
            setAccountDeleteError('')
            loadAccountsWithBalance()
        }
    }

    // ── Inventory handlers ─────────────────────────────────────────────────────
    const handleSaveItem = async (data: Parameters<typeof createItem>[0]) => {
        if (editItem) {
            await updateItem(editItem.id, data)
        } else {
            await createItem(data)
        }
        setShowItemModal(false)
        setEditItem(null)
        loadStock()
    }

    const handleDeleteItem = async () => {
        if (!editItem) return
        await deleteItem(editItem.id)
        setShowItemModal(false)
        setEditItem(null)
        loadStock()
    }

    // ── Computed values ────────────────────────────────────────────────────────
    const totalIn  = movements.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0)
    const totalOut = movements.filter(m => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0)
    const lowStockCount = stockItems.filter(i => i.stock_current <= i.stock_min && i.stock_min > 0).length

    const handleFAB = () => {
        if (activeTab === 'movimientos') { setEditMovement(null); setShowMovementModal(true) }
        else if (activeTab === 'cuentas') { setEditAccount(null); setAccountDeleteError(''); setShowAccountModal(true) }
        else if (activeTab === 'inventario') { setEditItem(null); setShowItemModal(true) }
    }

    const tabSubtitle = {
        movimientos: `${movements.length} registros`,
        inventario: `${stockItems.length} ítems${lowStockCount > 0 ? ` · ${lowStockCount} bajo stock` : ''}`,
        cuentas: `${accountsWithBalance.length} cuentas`,
        reportes: 'Análisis',
    }[activeTab]

    return (
        <>
            <TopBar
                title="Finanzas"
                subtitle={tabSubtitle}
                actions={
                    activeTab !== 'reportes' ? (
                        <div className="hidden sm:flex items-center gap-2">
                            {activeTab === 'movimientos' && (
                                <button
                                    onClick={() => setShowTransferModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-navy-900 font-bold text-xs uppercase rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">swap_horiz</span>
                                    Transferencia
                                </button>
                            )}
                            <button
                                onClick={handleFAB}
                                className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                {activeTab === 'movimientos' ? 'Nuevo movimiento' : activeTab === 'cuentas' ? 'Nueva cuenta' : 'Nuevo ítem'}
                            </button>
                        </div>
                    ) : null
                }
            />

            {/* Tabs */}
            <div className="px-6 lg:px-8 pt-4 pb-2 border-b border-gray-200 bg-white flex flex-wrap items-center gap-4">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {(['movimientos', 'inventario', 'cuentas', 'reportes'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap',
                                activeTab === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-900'
                            )}
                        >
                            {tab === 'movimientos' ? 'Movimientos' :
                             tab === 'inventario'  ? 'Inventario'  :
                             tab === 'cuentas'     ? 'Cuentas'     : 'Reportes'}
                        </button>
                    ))}
                </div>

                {/* Movement type filter */}
                {activeTab === 'movimientos' && (
                    <div className="flex gap-1 flex-wrap">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilters(prev => ({ ...prev, type: f.value as MovementType | 'todos' }))}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all',
                                    (filters.type ?? 'todos') === f.value
                                        ? 'bg-navy-900 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary bar for movements */}
            {activeTab === 'movimientos' && movements.length > 0 && (
                <div className="px-6 lg:px-8 py-2 bg-gray-50 border-b border-gray-200 flex gap-6 text-xs font-bold">
                    <span className="text-green-600">+ {formatCurrency(totalIn)}</span>
                    <span className="text-red-600">- {formatCurrency(totalOut)}</span>
                    <span className={`ml-auto ${totalIn - totalOut >= 0 ? 'text-navy-900' : 'text-red-600'}`}>
                        Neto: {formatCurrency(totalIn - totalOut)}
                    </span>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-24 md:pb-8">
                {/* MOVIMIENTOS */}
                {activeTab === 'movimientos' && (
                    movementsLoading ? (
                        <div className="space-y-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : movements.length === 0 ? (
                        <EmptyState icon="account_balance_wallet" title="Sin movimientos" subtitle="Registrá el primer movimiento financiero" />
                    ) : (
                        <div className="space-y-2">
                            {movements.map(m => (
                                <MovementCard
                                    key={m.id}
                                    movement={m}
                                    onEdit={() => { setEditMovement(m); setShowMovementModal(true) }}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* INVENTARIO */}
                {activeTab === 'inventario' && (
                    inventoryLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : stockItems.length === 0 ? (
                        <EmptyState icon="inventory_2" title="Sin ítems" subtitle="Creá los ítems de inventario del taller" />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stockItems.map(i => (
                                <InventoryItemCard
                                    key={i.id}
                                    item={i}
                                    onEdit={() => { setEditItem(i); setShowItemModal(true) }}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* CUENTAS */}
                {activeTab === 'cuentas' && (
                    accountsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : accountsWithBalance.length === 0 ? (
                        <EmptyState icon="account_balance" title="Sin cuentas" subtitle="Creá las cuentas bancarias y de efectivo" />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {accountsWithBalance.map(a => (
                                <AccountCard
                                    key={a.id}
                                    account={a}
                                    onEdit={() => { setEditAccount(a); setAccountDeleteError(''); setShowAccountModal(true) }}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* REPORTES */}
                {activeTab === 'reportes' && <ReportsView />}
            </main>

            {/* Mobile FAB */}
            {activeTab !== 'reportes' && (
                <button
                    onClick={handleFAB}
                    className="sm:hidden fixed right-6 bottom-24 z-30 h-14 w-14 rounded-full bg-navy-900 shadow-lg flex items-center justify-center text-white hover:bg-navy-800 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-3xl icon-filled">add</span>
                </button>
            )}

            {/* Movement modal */}
            {showMovementModal && (
                <MovementModal
                    movement={editMovement ?? undefined}
                    accounts={accounts}
                    categories={categories}
                    inventoryItems={inventoryItems}
                    employees={employees}
                    projects={projects as any}
                    entities={entities}
                    onSave={handleSaveMovement}
                    onClose={() => { setShowMovementModal(false); setEditMovement(null) }}
                    onDelete={editMovement ? handleDeleteMovement : undefined}
                />
            )}

            {/* Transfer modal */}
            {showTransferModal && (
                <TransferModal
                    accounts={accounts}
                    entities={entities}
                    onSave={handleSaveTransfer}
                    onClose={() => setShowTransferModal(false)}
                />
            )}

            {/* Account modal */}
            {showAccountModal && (
                <AccountModal
                    account={editAccount ?? undefined}
                    entities={entities}
                    onSave={handleSaveAccount}
                    onClose={() => { setShowAccountModal(false); setEditAccount(null); setAccountDeleteError('') }}
                    onDelete={editAccount ? handleDeleteAccount : undefined}
                    deleteError={accountDeleteError}
                />
            )}

            {/* Inventory item modal */}
            {showItemModal && (
                <InventoryItemModal
                    item={editItem ?? undefined}
                    onSave={handleSaveItem}
                    onClose={() => { setShowItemModal(false); setEditItem(null) }}
                    onDelete={editItem ? handleDeleteItem : undefined}
                />
            )}
        </>
    )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-400">{icon}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{title}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    )
}
