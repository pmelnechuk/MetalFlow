import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { PurchaseCard } from '../components/compras/PurchaseCard'
import { SupplierCard } from '../components/compras/SupplierCard'
import { PurchaseModal } from '../components/compras/PurchaseModal'
import { BuyModal } from '../components/compras/BuyModal'
import { SupplierModal } from '../components/compras/SupplierModal'
import { usePurchases } from '../hooks/usePurchases'
import { useSuppliers } from '../hooks/useSuppliers'
import { useProjects } from '../hooks/useProjects'
import { useAccounts } from '../hooks/useAccounts'
import { useInventory } from '../hooks/useInventory'
import { useMovements } from '../hooks/useMovements'
import { useCreditCards } from '../hooks/useCreditCards'
import { useInstallments } from '../hooks/useInstallments'
import { useEntities } from '../hooks/useEntities'
import { cn, formatCurrency } from '../lib/utils'
import type { Purchase, Supplier, SupplierWithStats, PurchaseStatus } from '../types/database'

type Tab = 'compras' | 'proveedores'

const STATUS_FILTERS: { value: PurchaseStatus | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'comprado', label: 'Comprado' },
    { value: 'cancelado', label: 'Cancelado' },
]

export function ComprasPage() {
    const [activeTab, setActiveTab] = useState<Tab>('compras')
    const { purchases, loading: purchasesLoading, statusFilter, setStatusFilter, setSupplierFilter, createPurchase, updatePurchase, markAsBought, deletePurchase } = usePurchases()
    const { suppliers, loading: suppliersLoading, createSupplier, updateSupplier, deleteSupplier, getSuppliersWithStats } = useSuppliers()
    const { allProjects } = useProjects()
    const { accounts } = useAccounts()
    const { items: inventoryItems } = useInventory()
    const { createMovement } = useMovements()
    const { cards: creditCards } = useCreditCards()
    const { createInstallmentPurchase } = useInstallments()
    const { entities } = useEntities()

    const [suppliersWithStats, setSuppliersWithStats] = useState<SupplierWithStats[]>([])
    const [statsLoading, setStatsLoading] = useState(false)
    const [projects, setProjects] = useState<{ id: string; name: string; client: string }[]>([])

    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [editPurchase, setEditPurchase] = useState<Purchase | null>(null)
    const [buyPurchase, setBuyPurchase] = useState<Purchase | null>(null)
    const [showSupplierModal, setShowSupplierModal] = useState(false)
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
    const [supplierDeleteError, setSupplierDeleteError] = useState('')

    const loadStats = useCallback(async () => {
        setStatsLoading(true)
        const stats = await getSuppliersWithStats()
        setSuppliersWithStats(stats)
        setStatsLoading(false)
    }, [getSuppliersWithStats])

    useEffect(() => {
        if (activeTab === 'proveedores') loadStats()
    }, [activeTab, loadStats])

    useEffect(() => {
        allProjects().then(setProjects)
    }, [allProjects])

    // --- Purchase handlers ---
    const handleOpenCreate = () => {
        setEditPurchase(null)
        setShowPurchaseModal(true)
    }

    const handleSavePurchase = async (data: Parameters<typeof createPurchase>[0]) => {
        if (editPurchase) {
            await updatePurchase(editPurchase.id, data as any)
        } else {
            await createPurchase(data)
        }
        setShowPurchaseModal(false)
        setEditPurchase(null)
        if (activeTab === 'proveedores') loadStats()
    }

    const handleDeletePurchase = async () => {
        if (!editPurchase) return
        await deletePurchase(editPurchase.id)
        setShowPurchaseModal(false)
        setEditPurchase(null)
        if (activeTab === 'proveedores') loadStats()
    }

    const handleMarkBought = async (unit_price: number, movementData?: {
        account_id: string
        entity_id: string
        inventory_item_id?: string
        inventory_qty?: number
    }) => {
        if (!buyPurchase) return
        const updated = await markAsBought(buyPurchase.id, unit_price)
        if (updated && movementData) {
            const today = new Date().toISOString().split('T')[0]
            const movement = await createMovement({
                entity_id: movementData.entity_id,
                account_id: movementData.account_id,
                type: 'compra_insumo',
                amount: -(unit_price * (buyPurchase.quantity ?? 1)),
                date: today,
                description: buyPurchase.description,
                project_id: buyPurchase.project_id || undefined,
                inventory_item_id: movementData.inventory_item_id,
                inventory_qty: movementData.inventory_qty,
                purchase_id: buyPurchase.id,
            })
            if (movement) {
                const mov = movement as unknown as { id: string }
                await updatePurchase(buyPurchase.id, { movement_id: mov.id } as any)
            }
        }
        setBuyPurchase(null)
        loadStats()
    }

    const handleMarkBoughtInstallments = async (unit_price: number, installmentData: {
        credit_card_id: string
        num_installments: number
        first_due_date: string
        category_id?: string
    }) => {
        if (!buyPurchase) return
        const total = unit_price * (buyPurchase.quantity ?? 1)
        await markAsBought(buyPurchase.id, unit_price)
        const ip = await createInstallmentPurchase({
            credit_card_id: installmentData.credit_card_id,
            purchase_id: buyPurchase.id,
            description: buyPurchase.description,
            total_amount: total,
            num_installments: installmentData.num_installments,
            first_due_date: installmentData.first_due_date,
            category_id: installmentData.category_id,
        })
        if (ip) {
            await updatePurchase(buyPurchase.id, { movement_id: null } as any)
        }
        setBuyPurchase(null)
        loadStats()
    }

    // --- Supplier handlers ---
    const handleSaveSupplier = async (data: { name: string; category: string; phone?: string; notes?: string }) => {
        if (editSupplier) {
            await updateSupplier(editSupplier.id, data)
        } else {
            await createSupplier(data)
        }
        setShowSupplierModal(false)
        setEditSupplier(null)
        setSupplierDeleteError('')
        loadStats()
    }

    const handleDeleteSupplier = async () => {
        if (!editSupplier) return
        const result = await deleteSupplier(editSupplier.id)
        if (!result.ok) {
            setSupplierDeleteError(result.error || 'Error al eliminar.')
        } else {
            setShowSupplierModal(false)
            setEditSupplier(null)
            setSupplierDeleteError('')
            loadStats()
        }
    }

    const handleViewSupplierPurchases = (supplierId: string) => {
        setSupplierFilter(supplierId)
        setStatusFilter('todas')
        setActiveTab('compras')
    }

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab)
        if (tab === 'compras') setSupplierFilter(null)
    }

    const pendingCount = purchases.filter(p => p.status === 'pendiente').length
    const boughtPurchases = purchases.filter(p => p.status === 'comprado')
    const totalSpent = boughtPurchases.reduce((s, p) => s + (p.unit_price ?? 0) * (p.quantity ?? 1), 0)
    const registeredInFinanzas = boughtPurchases.filter(p => p.movement_id).length

    return (
        <>
            <TopBar
                title="Compras"
                subtitle={
                    activeTab === 'compras'
                        ? `${purchases.length} ítem${purchases.length !== 1 ? 's' : ''} · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`
                        : `${suppliers.length} proveedor${suppliers.length !== 1 ? 'es' : ''}`
                }
                actions={
                    <button
                        onClick={activeTab === 'compras' ? handleOpenCreate : () => { setEditSupplier(null); setShowSupplierModal(true) }}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        {activeTab === 'compras' ? 'Agregar Ítem' : 'Nuevo Proveedor'}
                    </button>
                }
            />

            {/* Financial summary bar */}
            {boughtPurchases.length > 0 && (
                <div className="px-6 lg:px-8 py-2 bg-navy-900 flex items-center gap-6 text-white overflow-x-auto">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-base text-green-400">payments</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-300">Total comprado</span>
                        <span className="text-xs font-black text-white ml-1">{formatCurrency(totalSpent)}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-base text-blue-400">link</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-300">En finanzas</span>
                        <span className="text-xs font-black text-white ml-1">{registeredInFinanzas}/{boughtPurchases.length}</span>
                    </div>
                    {registeredInFinanzas < boughtPurchases.length && (
                        <>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="material-symbols-outlined text-base text-amber-400">warning</span>
                                <span className="text-xs font-bold text-amber-300">{boughtPurchases.length - registeredInFinanzas} sin registrar</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Tabs + filter */}
            <div className="px-6 lg:px-8 pt-4 pb-2 border-b border-gray-200 bg-white flex flex-wrap items-center gap-4">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {(['compras', 'proveedores'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={cn(
                                'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all',
                                activeTab === tab
                                    ? 'bg-white text-navy-900 shadow-sm'
                                    : 'text-gray-500 hover:text-navy-900'
                            )}
                        >
                            {tab === 'compras' ? 'Lista de Compras' : 'Proveedores'}
                        </button>
                    ))}
                </div>

                {activeTab === 'compras' && (
                    <div className="flex gap-1 flex-wrap">
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all',
                                    statusFilter === f.value
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

            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                {/* COMPRAS TAB */}
                {activeTab === 'compras' && (
                    <>
                        {purchasesLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton h-44 rounded-xl" />
                                ))}
                            </div>
                        ) : purchases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-gray-400">shopping_cart</span>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">No hay ítems</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {statusFilter !== 'todas' ? 'Probá otro filtro' : 'Agregá el primer ítem a comprar'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {purchases.map(p => (
                                    <PurchaseCard
                                        key={p.id}
                                        purchase={p}
                                        onEdit={() => { setEditPurchase(p); setShowPurchaseModal(true) }}
                                        onMarkBought={() => setBuyPurchase(p)}
                                        onDelete={() => deletePurchase(p.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* PROVEEDORES TAB */}
                {activeTab === 'proveedores' && (
                    <>
                        {suppliersLoading || statsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton h-52 rounded-xl" />
                                ))}
                            </div>
                        ) : suppliersWithStats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-gray-400">storefront</span>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">No hay proveedores</p>
                                <p className="text-xs text-gray-400 mt-1">Creá el primer proveedor</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliersWithStats.map(s => (
                                    <SupplierCard
                                        key={s.id}
                                        supplier={s}
                                        onEdit={() => { setEditSupplier(s); setSupplierDeleteError(''); setShowSupplierModal(true) }}
                                        onViewPurchases={() => handleViewSupplierPurchases(s.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Mobile FABs */}
            <button
                onClick={activeTab === 'compras' ? handleOpenCreate : () => { setEditSupplier(null); setShowSupplierModal(true) }}
                className="sm:hidden fixed right-6 bottom-24 z-30 h-14 w-14 rounded-full bg-navy-900 shadow-lg flex items-center justify-center text-white hover:bg-navy-800 transition-all hover:scale-105 active:scale-95"
            >
                <span className="material-symbols-outlined text-3xl icon-filled">add</span>
            </button>

            {/* Purchase modal */}
            {showPurchaseModal && (
                <PurchaseModal
                    purchase={editPurchase || undefined}
                    suppliers={suppliers}
                    projects={projects}
                    onSave={handleSavePurchase}
                    onClose={() => { setShowPurchaseModal(false); setEditPurchase(null) }}
                    onDelete={editPurchase ? handleDeletePurchase : undefined}
                    onCreateSupplier={createSupplier}
                />
            )}

            {/* Buy modal */}
            {buyPurchase && (
                <BuyModal
                    purchase={buyPurchase}
                    accounts={accounts}
                    inventoryItems={inventoryItems}
                    creditCards={creditCards}
                    entities={entities}
                    onConfirm={handleMarkBought}
                    onConfirmInstallments={handleMarkBoughtInstallments}
                    onClose={() => setBuyPurchase(null)}
                />
            )}

            {/* Supplier modal */}
            {showSupplierModal && (
                <SupplierModal
                    supplier={editSupplier || undefined}
                    onSave={handleSaveSupplier}
                    onClose={() => { setShowSupplierModal(false); setEditSupplier(null); setSupplierDeleteError('') }}
                    onDelete={editSupplier ? handleDeleteSupplier : undefined}
                    deleteError={supplierDeleteError}
                />
            )}
        </>
    )
}
