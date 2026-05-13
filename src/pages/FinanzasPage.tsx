import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { MovementCard } from '../components/finanzas/MovementCard'
import { MovementModal } from '../components/finanzas/MovementModal'
import { AccountCard } from '../components/finanzas/AccountCard'
import { AccountModal } from '../components/finanzas/AccountModal'
import { BankModal } from '../components/finanzas/BankModal'
import { CreditCardCard } from '../components/finanzas/CreditCardCard'
import { CreditCardModal } from '../components/finanzas/CreditCardModal'
import { InstallmentPurchaseModal } from '../components/finanzas/InstallmentPurchaseModal'
import { InstallmentsView } from '../components/finanzas/InstallmentsView'
import { ActiveInstallmentsSection } from '../components/finanzas/ActiveInstallmentsSection'
import { InvoiceModal } from '../components/finanzas/InvoiceModal'
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
import { useBanks } from '../hooks/useBanks'
import { useCreditCards } from '../hooks/useCreditCards'
import { useInstallments } from '../hooks/useInstallments'
import { useReceipts } from '../hooks/useReceipts'
import { useSuppliers } from '../hooks/useSuppliers'
import { cn, formatCurrency } from '../lib/utils'
import type {
    Movement, MovementType,
    AccountWithBalance, InventoryStock,
    CreditCardBalance, UpcomingInstallment,
    Account, ExpenseCategory, Bank, CreditCard,
} from '../types/database'
import type { ActivePurchase } from '../hooks/useInstallments'

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
    const { accounts, getAccountsWithBalance, createAccount, updateAccount, deleteAccount } = useAccounts()
    const { items: inventoryItems, loading: inventoryLoading, getStock, createItem, updateItem, deleteItem } = useInventory()
    const { entities } = useEntities()
    const { categories, createCategory } = useExpenseCategories()
    const { employees } = useEmployees()
    const { allProjects } = useProjects()
    const { banks, createBank, updateBank, deleteBank } = useBanks()
    const { cards, getCardsWithBalance, createCard, updateCard, deleteCard } = useCreditCards()
    const { createInstallmentPurchase, payInstallment, getUpcomingInstallments, getActiveInstallmentPurchases, updateInstallmentPurchase, cancelInstallmentPurchase } = useInstallments()
    const { uploadReceipt, saveReceiptRecord } = useReceipts()
    const { suppliers } = useSuppliers()

    const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([])
    const [stockItems, setStockItems] = useState<InventoryStock[]>([])
    const [projects, setProjects] = useState<{ id: string; name: string; client: string; status: string | null }[]>([])
    const [cardsWithBalance, setCardsWithBalance] = useState<CreditCardBalance[]>([])
    const [upcomingInstallments, setUpcomingInstallments] = useState<UpcomingInstallment[]>([])
    const [activePurchases, setActivePurchases] = useState<ActivePurchase[]>([])
    const [cuentasLoading, setCuentasLoading] = useState(false)

    // Modal state
    const [showMovementModal, setShowMovementModal] = useState(false)
    const [editMovement, setEditMovement] = useState<Movement | null>(null)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showAccountModal, setShowAccountModal] = useState(false)
    const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null)
    const [accountDeleteError, setAccountDeleteError] = useState('')
    const [showBankModal, setShowBankModal] = useState(false)
    const [editBank, setEditBank] = useState<Bank | null>(null)
    const [showCardModal, setShowCardModal] = useState(false)
    const [editCard, setEditCard] = useState<CreditCard | null>(null)
    const [showInstallmentModal, setShowInstallmentModal] = useState(false)
    const [installmentCardId, setInstallmentCardId] = useState<string | undefined>()
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showItemModal, setShowItemModal] = useState(false)
    const [editItem, setEditItem] = useState<InventoryStock | null>(null)

    const loadStock = useCallback(async () => {
        const data = await getStock()
        setStockItems(data)
    }, [getStock])

    const loadCuentasData = useCallback(async () => {
        setCuentasLoading(true)
        const [accs, cds, insts, active] = await Promise.all([
            getAccountsWithBalance(),
            getCardsWithBalance(),
            getUpcomingInstallments(),
            getActiveInstallmentPurchases(),
        ])
        setAccountsWithBalance(accs)
        setCardsWithBalance(cds)
        setUpcomingInstallments(insts)
        setActivePurchases(active)
        setCuentasLoading(false)
    }, [getAccountsWithBalance, getCardsWithBalance, getUpcomingInstallments, getActiveInstallmentPurchases])

    useEffect(() => { allProjects().then(setProjects) }, [allProjects])

    useEffect(() => {
        if (activeTab === 'cuentas') loadCuentasData()
    }, [activeTab, loadCuentasData])

    useEffect(() => {
        if (activeTab === 'inventario') loadStock()
    }, [activeTab, loadStock])

    // ── Movement handlers ─────────────────────────────────────────────────────
    const handleSaveMovement = async (data: Parameters<typeof createMovement>[0]) => {
        if (editMovement) {
            await updateMovement(editMovement.id, {
                amount: data.amount, date: data.date, description: data.description,
                category_id: data.category_id, project_id: data.project_id,
                employee_id: data.employee_id, inventory_item_id: data.inventory_item_id,
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
        if (activeTab === 'cuentas') loadCuentasData()
    }

    const handleSaveTransfer = async (data: Parameters<typeof createTransfer>[0]) => {
        await createTransfer(data)
        setShowTransferModal(false)
        if (activeTab === 'cuentas') loadCuentasData()
    }

    type InvoiceSaveData = {
        receiptFile?: File
        supplierId?: string
        supplierName?: string
        date: string
        items: { inventoryItemId?: string; newItem?: { name: string; unit: string; stock_min: number; description?: string }; quantity: number; unit_price: number; name: string }[]
        total: number
        categoryId?: string
        projectId?: string
        paymentMode: 'account' | 'card'
        accountId?: string
        entityId?: string
        cardId?: string
        numInstallments?: number
        notes?: string
    }

    // ── Invoice handler ───────────────────────────────────────────────────────
    const handleSaveInvoice = useCallback(async (data: InvoiceSaveData) => {
        // 1. Create new inventory items if needed
        const itemsWithIds = await Promise.all(data.items.map(async item => {
            if (item.newItem) {
                const created = await createItem({
                    name: item.newItem.name,
                    unit: item.newItem.unit,
                    stock_min: item.newItem.stock_min,
                    description: item.newItem.description,
                })
                return { ...item, resolvedInventoryItemId: created ? (created as any).id : undefined }
            }
            return { ...item, resolvedInventoryItemId: item.inventoryItemId }
        }))

        let firstMovementId: string | undefined
        let installmentPurchaseId: string | undefined

        if (data.paymentMode === 'account' && data.accountId && data.entityId) {
            // Create one compra_insumo movement per item
            for (const item of itemsWithIds) {
                const amount = -(item.quantity * item.unit_price)
                const mov = await createMovement({
                    entity_id: data.entityId,
                    account_id: data.accountId,
                    type: 'compra_insumo',
                    amount,
                    date: data.date,
                    description: item.name,
                    category_id: data.categoryId,
                    project_id: data.projectId,
                    inventory_item_id: item.resolvedInventoryItemId,
                    inventory_qty: item.resolvedInventoryItemId ? item.quantity : undefined,
                })
                if (mov && !firstMovementId) firstMovementId = (mov as any).id
            }
        } else if (data.paymentMode === 'card' && data.cardId) {
            // Create installment purchase
            const card = cards.find(c => c.id === data.cardId)
            if (card) {
                const ip = await createInstallmentPurchase({
                    credit_card_id: data.cardId,
                    description: data.supplierName
                        ? `Factura ${data.supplierName}`
                        : `Factura ${data.date}`,
                    total_amount: data.total,
                    num_installments: data.numInstallments ?? 1,
                    first_due_date: (() => {
                        const today = new Date()
                        const d = new Date(today.getFullYear(), today.getMonth(), card.due_day)
                        if (d <= today) d.setMonth(d.getMonth() + 1)
                        return d.toISOString().split('T')[0]
                    })(),
                    category_id: data.categoryId,
                    project_id: data.projectId,
                })
                if (ip) installmentPurchaseId = ip.id
            }
        }

        // 2. Upload receipt and save record
        if (data.receiptFile) {
            const contextId = firstMovementId ?? installmentPurchaseId ?? Date.now().toString()
            const uploaded = await uploadReceipt(data.receiptFile, contextId)
            if (uploaded) {
                await saveReceiptRecord({
                    movement_id: firstMovementId,
                    installment_purchase_id: installmentPurchaseId,
                    storage_path: uploaded.storage_path,
                    filename: data.receiptFile.name,
                    mime_type: data.receiptFile.type,
                    size_bytes: data.receiptFile.size,
                })
            }
        }

        setShowInvoiceModal(false)
        if (activeTab === 'inventario') loadStock()
        if (activeTab === 'cuentas') loadCuentasData()
    }, [cards, createItem, createMovement, createInstallmentPurchase, uploadReceipt, saveReceiptRecord, activeTab, loadStock, loadCuentasData])

    // ── Account handlers ──────────────────────────────────────────────────────
    const handleSaveAccount = async (data: Parameters<typeof createAccount>[0]) => {
        if (editAccount) {
            await updateAccount(editAccount.id, {
                name: data.name, type: data.type, initial_balance: data.initial_balance,
                bank_id: data.bank_id, overdraft_limit: data.overdraft_limit,
                card_last4: data.card_last4, card_brand: data.card_brand,
            })
        } else {
            await createAccount(data)
        }
        setShowAccountModal(false)
        setEditAccount(null)
        setAccountDeleteError('')
        loadCuentasData()
    }

    const handleDeleteAccount = async () => {
        if (!editAccount) return
        const result = await deleteAccount(editAccount.id)
        if (!result.ok) {
            setAccountDeleteError(result.error || 'Error al eliminar.')
        } else {
            setShowAccountModal(false); setEditAccount(null); setAccountDeleteError('')
            loadCuentasData()
        }
    }

    // ── Bank handlers ─────────────────────────────────────────────────────────
    const handleSaveBank = async (data: { name: string; short_name?: string; entity_id?: string }) => {
        if (editBank) {
            await updateBank(editBank.id, data)
        } else {
            await createBank(data)
        }
        setShowBankModal(false)
        setEditBank(null)
    }

    const handleDeleteBank = async () => {
        if (!editBank) return
        await deleteBank(editBank.id)
        setShowBankModal(false)
        setEditBank(null)
    }

    // ── Credit card handlers ──────────────────────────────────────────────────
    const handleSaveCard = async (data: Omit<CreditCard, 'id' | 'created_at'>) => {
        if (editCard) {
            await updateCard(editCard.id, data)
        } else {
            await createCard(data)
        }
        setShowCardModal(false)
        setEditCard(null)
        loadCuentasData()
    }

    const handleDeleteCard = async () => {
        if (!editCard) return
        // Cancel any active installment purchases before deleting
        const related = activePurchases.filter(p => p.credit_card_id === editCard.id)
        for (const p of related) {
            await cancelInstallmentPurchase(p.id)
        }
        await deleteCard(editCard.id)
        setShowCardModal(false)
        setEditCard(null)
        loadCuentasData()
    }

    const cardDeleteWarning = editCard
        ? (() => {
            const related = activePurchases.filter(p => p.credit_card_id === editCard.id)
            if (related.length === 0) return undefined
            const pendingCuotas = related.reduce((s, p) => s + p.installments.filter(i => i.status !== 'pagado').length, 0)
            return `Esta tarjeta tiene ${related.length} compra${related.length !== 1 ? 's' : ''} activa${related.length !== 1 ? 's' : ''} en cuotas con ${pendingCuotas} cuota${pendingCuotas !== 1 ? 's' : ''} pendiente${pendingCuotas !== 1 ? 's' : ''}. Al eliminarla se cancelarán automáticamente.`
        })()
        : undefined

    // ── Installment handlers ──────────────────────────────────────────────────
    const handleSaveInstallmentPurchase = async (data: Parameters<typeof createInstallmentPurchase>[0]) => {
        await createInstallmentPurchase(data)
        setShowInstallmentModal(false)
        setInstallmentCardId(undefined)
        loadCuentasData()
    }

    const handlePayInstallment = async (installment: UpcomingInstallment, accountId: string) => {
        const account = accounts.find(a => a.id === accountId)
        if (!account) return
        const mov = await createMovement({
            entity_id: account.entity_id,
            account_id: accountId,
            type: 'gasto',
            amount: -installment.amount,
            date: new Date().toISOString().split('T')[0],
            description: `Cuota ${installment.installment_number}/${installment.num_installments}: ${installment.description}`,
        })
        if (mov) {
            await payInstallment(installment.id, (mov as any).id)
        }
        loadCuentasData()
    }

    const handleBulkPayMonth = async (items: UpcomingInstallment[], accountId: string) => {
        const account = accounts.find(a => a.id === accountId)
        if (!account) return
        const total = items.reduce((s, i) => s + i.amount, 0)
        const cardNames = [...new Set(items.map(i => i.card_name))].join(', ')
        const month = new Date(items[0].due_date + 'T00:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
        const mov = await createMovement({
            entity_id: account.entity_id,
            account_id: accountId,
            type: 'gasto',
            amount: -total,
            date: new Date().toISOString().split('T')[0],
            description: `Resumen tarjeta ${cardNames} — ${month}`,
        })
        if (mov) {
            const movId = (mov as any).id
            for (const inst of items) {
                await payInstallment(inst.id, movId)
            }
        }
        loadCuentasData()
    }

    const handleCancelPurchase = async (id: string) => {
        await cancelInstallmentPurchase(id)
        loadCuentasData()
    }

    const handleUpdatePurchase = async (id: string, data: { description?: string; category_id?: string | null }) => {
        await updateInstallmentPurchase(id, data)
        setActivePurchases(prev => prev.map(p => p.id === id ? { ...p, ...data, category: data.category_id === null ? null : p.category } : p))
    }

    // ── Inventory handlers ────────────────────────────────────────────────────
    const handleSaveItem = async (data: Parameters<typeof createItem>[0]) => {
        if (editItem) await updateItem(editItem.id, data)
        else await createItem(data)
        setShowItemModal(false); setEditItem(null)
        loadStock()
    }

    const handleDeleteItem = async () => {
        if (!editItem) return
        await deleteItem(editItem.id)
        setShowItemModal(false); setEditItem(null)
        loadStock()
    }

    // ── Computed ──────────────────────────────────────────────────────────────
    const totalIn  = movements.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0)
    const totalOut = movements.filter(m => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0)
    const lowStockCount = stockItems.filter(i => i.stock_current <= i.stock_min && i.stock_min > 0).length

    const bankMap = new Map(banks.map(b => [b.id, b]))

    const handleFAB = () => {
        if (activeTab === 'movimientos') { setEditMovement(null); setShowMovementModal(true) }
        else if (activeTab === 'cuentas') { setEditAccount(null); setAccountDeleteError(''); setShowAccountModal(true) }
        else if (activeTab === 'inventario') { setEditItem(null); setShowItemModal(true) }
    }

    const tabSubtitle = {
        movimientos: `${movements.length} registros`,
        inventario: `${stockItems.length} ítems${lowStockCount > 0 ? ` · ${lowStockCount} bajo stock` : ''}`,
        cuentas: `${accountsWithBalance.length} cuentas · ${cardsWithBalance.length} tarjetas`,
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
                                <>
                                    <button
                                        onClick={() => setShowInvoiceModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 border border-orange-300 text-orange-700 font-bold text-xs uppercase rounded-lg hover:bg-orange-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                                        Factura
                                    </button>
                                    <button
                                        onClick={() => setShowTransferModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-navy-900 font-bold text-xs uppercase rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">swap_horiz</span>
                                        Transferencia
                                    </button>
                                </>
                            )}
                            {activeTab === 'cuentas' && (
                                <button
                                    onClick={() => { setEditCard(null); setShowCardModal(true) }}
                                    className="flex items-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 font-bold text-xs uppercase rounded-lg hover:bg-purple-50 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">credit_card</span>
                                    Tarjeta
                                </button>
                            )}
                            <button
                                onClick={handleFAB}
                                className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                {activeTab === 'movimientos' ? 'Movimiento' : activeTab === 'cuentas' ? 'Cuenta' : 'Ítem'}
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
                            onClick={() => { if (tab === 'cuentas') setCuentasLoading(true); setActiveTab(tab) }}
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

            {/* Summary bar */}
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
                                <InventoryItemCard key={i.id} item={i} onEdit={() => { setEditItem(i); setShowItemModal(true) }} />
                            ))}
                        </div>
                    )
                )}

                {/* CUENTAS */}
                {activeTab === 'cuentas' && (
                    cuentasLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Accounts section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Cuentas y efectivo</h3>
                                    {accountsWithBalance.length === 0 && (
                                        <button
                                            onClick={() => { setEditAccount(null); setAccountDeleteError(''); setShowAccountModal(true) }}
                                            className="text-xs font-bold text-navy-700 hover:text-navy-900 flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Nueva cuenta
                                        </button>
                                    )}
                                </div>
                                {accountsWithBalance.length === 0 ? (
                                    <EmptyState icon="account_balance" title="Sin cuentas" subtitle="Creá las cuentas bancarias y de efectivo" />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {accountsWithBalance.map(a => (
                                            <AccountCard
                                                key={a.id}
                                                account={a}
                                                bankName={a.bank_id ? bankMap.get(a.bank_id)?.name : undefined}
                                                onEdit={() => { setEditAccount(a); setAccountDeleteError(''); setShowAccountModal(true) }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Credit cards section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Tarjetas de crédito</h3>
                                    <button
                                        onClick={() => { setEditCard(null); setShowCardModal(true) }}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Nueva tarjeta
                                    </button>
                                </div>
                                {cardsWithBalance.length === 0 ? (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <span className="material-symbols-outlined text-xl text-gray-400">credit_card_off</span>
                                        <p className="text-xs text-gray-400">Sin tarjetas de crédito registradas</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cardsWithBalance.map(c => (
                                            <CreditCardCard
                                                key={c.id}
                                                card={c}
                                                installments={upcomingInstallments}
                                                onEdit={() => {
                                                    setEditCard(cards.find(cc => cc.id === c.id) ?? null)
                                                    setShowCardModal(true)
                                                }}
                                                onNewInstallmentPurchase={() => {
                                                    setInstallmentCardId(c.id)
                                                    setShowInstallmentModal(true)
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Active installment purchases */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Compras activas en cuotas</h3>
                                    <span className="text-[10px] font-bold text-gray-400">{activePurchases.length} activa{activePurchases.length !== 1 ? 's' : ''}</span>
                                </div>
                                <ActiveInstallmentsSection
                                    purchases={activePurchases}
                                    categories={categories}
                                    onCancel={handleCancelPurchase}
                                    onUpdate={handleUpdatePurchase}
                                />
                            </section>

                            {/* Upcoming installments timeline */}
                            {upcomingInstallments.filter(i => i.status !== 'pagado').length > 0 && (
                                <section>
                                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-4">Cuotas pendientes — próximos 6 meses</h3>
                                    <InstallmentsView
                                        installments={upcomingInstallments}
                                        accounts={accounts}
                                        onPayInstallment={handlePayInstallment}
                                        onPayAllMonth={handleBulkPayMonth}
                                    />
                                </section>
                            )}

                            {/* Banks section */}
                            {banks.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Bancos</h3>
                                        <button
                                            onClick={() => { setEditBank(null); setShowBankModal(true) }}
                                            className="text-xs font-bold text-navy-700 hover:text-navy-900 flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Nuevo banco
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        {banks.map((bank, idx) => {
                                            const linkedAccounts = accountsWithBalance.filter(a => a.bank_id === bank.id).length
                                            const linkedCards = cardsWithBalance.filter(c => c.bank_name === bank.name).length
                                            const entity = entities.find(e => e.id === bank.entity_id)
                                            return (
                                                <div key={bank.id} className={`flex items-center gap-4 px-4 py-3 ${idx < banks.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-lg text-gray-500">corporate_fare</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-navy-900">{bank.name}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {entity ? entity.name : 'Sin entidad'}
                                                            {(linkedAccounts > 0 || linkedCards > 0) && (
                                                                <span> · {linkedAccounts > 0 && `${linkedAccounts} cuenta${linkedAccounts !== 1 ? 's' : ''}`}{linkedAccounts > 0 && linkedCards > 0 && ', '}{linkedCards > 0 && `${linkedCards} tarjeta${linkedCards !== 1 ? 's' : ''}`}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setEditBank(bank); setShowBankModal(true) }}
                                                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-navy-900 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}
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

            {/* Modals */}
            {showMovementModal && (
                <MovementModal
                    movement={editMovement ?? undefined}
                    accounts={accounts}
                    categories={categories}
                    inventoryItems={inventoryItems}
                    employees={employees}
                    projects={projects as any}
                    entities={entities}
                    banks={banks}
                    creditCards={cards}
                    onSave={handleSaveMovement}
                    onSaveInstallment={async (data) => {
                        await createInstallmentPurchase(data)
                        setShowMovementModal(false)
                        setEditMovement(null)
                        if (activeTab === 'cuentas') loadCuentasData()
                    }}
                    onClose={() => { setShowMovementModal(false); setEditMovement(null) }}
                    onDelete={editMovement ? handleDeleteMovement : undefined}
                    onCreateAccount={async (data) => createAccount(data) as Promise<Account | null>}
                    onCreateCategory={async (data) => createCategory(data) as Promise<ExpenseCategory | null>}
                />
            )}

            {showTransferModal && (
                <TransferModal
                    accounts={accounts}
                    entities={entities}
                    onSave={handleSaveTransfer}
                    onClose={() => setShowTransferModal(false)}
                />
            )}

            {showAccountModal && (
                <AccountModal
                    account={editAccount ?? undefined}
                    entities={entities}
                    banks={banks}
                    onSave={handleSaveAccount}
                    onClose={() => { setShowAccountModal(false); setEditAccount(null); setAccountDeleteError('') }}
                    onDelete={editAccount ? handleDeleteAccount : undefined}
                    deleteError={accountDeleteError}
                />
            )}

            {showBankModal && (
                <BankModal
                    bank={editBank ?? undefined}
                    entities={entities}
                    onSave={handleSaveBank}
                    onClose={() => { setShowBankModal(false); setEditBank(null) }}
                    onDelete={editBank ? handleDeleteBank : undefined}
                />
            )}

            {showCardModal && (
                <CreditCardModal
                    card={editCard ?? undefined}
                    entities={entities}
                    banks={banks}
                    onSave={handleSaveCard}
                    onClose={() => { setShowCardModal(false); setEditCard(null) }}
                    onDelete={editCard ? handleDeleteCard : undefined}
                    deleteWarning={cardDeleteWarning}
                />
            )}

            {showInstallmentModal && (
                <InstallmentPurchaseModal
                    cards={cards}
                    entities={entities}
                    categories={categories}
                    projects={projects as any}
                    purchaseId={undefined}
                    defaultCardId={installmentCardId}
                    onSave={handleSaveInstallmentPurchase}
                    onClose={() => { setShowInstallmentModal(false); setInstallmentCardId(undefined) }}
                />
            )}

            {showInvoiceModal && (
                <InvoiceModal
                    accounts={accounts}
                    entities={entities}
                    categories={categories}
                    inventoryItems={inventoryItems}
                    creditCards={cards}
                    suppliers={suppliers}
                    projects={projects as any}
                    onSave={handleSaveInvoice}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-400">{icon}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{title}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    )
}
