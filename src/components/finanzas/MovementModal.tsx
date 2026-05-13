import { useState, useEffect } from 'react'
import type { Movement, MovementType, Account, ExpenseCategory, InventoryItem, Entity } from '../../types/database'
import type { Employee, Project } from '../../types/database'
import { AccountModal } from './AccountModal'

const TYPE_OPTIONS: { value: MovementType; label: string; icon: string; sublabel: string }[] = [
    { value: 'gasto',          label: 'Gasto',          icon: 'payments',       sublabel: 'Luz, alquiler, etc.' },
    { value: 'ingreso',        label: 'Ingreso',        icon: 'trending_up',    sublabel: 'Cobro, venta, etc.' },
    { value: 'compra_insumo',  label: 'Compra',         icon: 'inventory_2',    sublabel: 'Suma al stock' },
    { value: 'pago_sueldo',    label: 'Sueldo',         icon: 'badge',          sublabel: 'Pago a empleado' },
    { value: 'consumo_insumo', label: 'Uso material',   icon: 'remove_circle',  sublabel: 'Resta del stock' },
]

const CATEGORY_COLORS = [
    '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444',
    '#10b981', '#6b7280', '#ec4899', '#f97316',
]

const CATEGORY_ICONS = [
    { icon: 'construction',     label: 'Materiales' },
    { icon: 'engineering',      label: 'M. obra' },
    { icon: 'receipt',          label: 'Servicios' },
    { icon: 'local_gas_station',label: 'Combustible' },
    { icon: 'payments',         label: 'Pagos' },
    { icon: 'shopping_cart',    label: 'Compras' },
    { icon: 'build',            label: 'Herramientas' },
    { icon: 'more_horiz',       label: 'Varios' },
]

interface Props {
    movement?: Movement
    accounts: Account[]
    categories: ExpenseCategory[]
    inventoryItems: InventoryItem[]
    employees: Employee[]
    projects: Project[]
    entities: Entity[]
    onSave: (data: {
        entity_id: string
        account_id: string
        type: MovementType
        amount: number
        date: string
        description?: string
        category_id?: string
        project_id?: string
        employee_id?: string
        inventory_item_id?: string
        inventory_qty?: number
    }) => void
    onClose: () => void
    onDelete?: () => void
    onCreateAccount: (data: { entity_id: string; name: string; type: Account['type']; initial_balance: number; currency: string }) => Promise<Account | null>
    onCreateCategory: (data: { name: string; color: string; icon: string }) => Promise<ExpenseCategory | null>
}

export function MovementModal({
    movement, accounts: accountsProp, categories: categoriesProp,
    inventoryItems, employees, projects, entities,
    onSave, onClose, onDelete, onCreateAccount, onCreateCategory,
}: Props) {
    const [type, setType]               = useState<MovementType>(movement?.type ?? 'gasto')
    const [amount, setAmount]           = useState(movement ? String(Math.abs(movement.amount)) : '')
    const [date, setDate]               = useState(movement?.date ?? new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState(movement?.description ?? '')
    const [entityId, setEntityId]       = useState(movement?.entity_id ?? (entities[0]?.id ?? ''))
    const [accountId, setAccountId]     = useState(movement?.account_id ?? '')
    const [categoryId, setCategoryId]   = useState(movement?.category_id ?? '')
    const [projectId, setProjectId]     = useState(movement?.project_id ?? '')
    const [employeeId, setEmployeeId]   = useState(movement?.employee_id ?? '')
    const [inventoryItemId, setInventoryItemId] = useState(movement?.inventory_item_id ?? '')
    const [inventoryQty, setInventoryQty]       = useState(movement?.inventory_qty != null ? String(movement.inventory_qty) : '')
    const [confirmDelete, setConfirmDelete]     = useState(false)

    // Local copies so inline creation updates immediately
    const [accountList, setAccountList]   = useState<Account[]>(accountsProp)
    const [categoryList, setCategoryList] = useState<ExpenseCategory[]>(categoriesProp)

    useEffect(() => { setAccountList(accountsProp) }, [accountsProp])
    useEffect(() => { setCategoryList(categoriesProp) }, [categoriesProp])

    // Auto-select first account of entity when entity changes
    useEffect(() => {
        if (!accountId) {
            const first = accountList.find(a => a.entity_id === entityId)
            if (first) setAccountId(first.id)
        }
    }, [entityId, accountList]) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync entity when account changes
    useEffect(() => {
        const acct = accountList.find(a => a.id === accountId)
        if (acct && acct.entity_id !== entityId) setEntityId(acct.entity_id)
    }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Inline creation states
    const [showNewAccount, setShowNewAccount]     = useState(false)
    const [showNewCategory, setShowNewCategory]   = useState(false)
    const [newCatName, setNewCatName]             = useState('')
    const [newCatColor, setNewCatColor]           = useState(CATEGORY_COLORS[0])
    const [newCatIcon, setNewCatIcon]             = useState(CATEGORY_ICONS[0].icon)
    const [savingCat, setSavingCat]               = useState(false)

    const filteredAccounts = entityId ? accountList.filter(a => a.entity_id === entityId) : accountList

    const needsCategory   = type === 'gasto' || type === 'compra_insumo'
    const needsProject    = type !== 'ingreso'
    const needsEmployee   = type === 'pago_sueldo'
    const needsInventory  = type === 'compra_insumo' || type === 'consumo_insumo'

    const canSave = amount && parseFloat(amount) > 0 && accountId && entityId

    const handleSave = () => {
        if (!canSave) return
        onSave({
            entity_id: entityId,
            account_id: accountId,
            type,
            amount: parseFloat(amount),
            date,
            description: description.trim() || undefined,
            category_id: needsCategory ? (categoryId || undefined) : undefined,
            project_id: needsProject ? (projectId || undefined) : undefined,
            employee_id: needsEmployee ? (employeeId || undefined) : undefined,
            inventory_item_id: needsInventory ? (inventoryItemId || undefined) : undefined,
            inventory_qty: needsInventory && inventoryQty ? parseFloat(inventoryQty) : undefined,
        })
    }

    const handleCreateAccount = async (data: { entity_id: string; name: string; type: Account['type']; initial_balance: number; currency: string }) => {
        const created = await onCreateAccount(data)
        if (created) {
            setAccountList(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setEntityId(created.entity_id)
            setAccountId(created.id)
        }
        setShowNewAccount(false)
    }

    const handleCreateCategory = async () => {
        if (!newCatName.trim()) return
        setSavingCat(true)
        const created = await onCreateCategory({ name: newCatName.trim(), color: newCatColor, icon: newCatIcon })
        if (created) {
            setCategoryList(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setCategoryId(created.id)
        }
        setNewCatName('')
        setShowNewCategory(false)
        setSavingCat(false)
    }

    return (
        <>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="w-9 h-9 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                        <span className="material-symbols-outlined text-xl icon-filled">account_balance_wallet</span>
                    </div>
                    <h2 className="text-base font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {movement ? 'Editar movimiento' : 'Nuevo movimiento'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

                    {/* Tipo */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wide">¿Qué es este movimiento?</label>
                        <div className="grid grid-cols-5 gap-1">
                            {TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setType(opt.value)}
                                    title={opt.sublabel}
                                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all text-center ${
                                        type === opt.value
                                            ? 'border-navy-900 bg-navy-50 text-navy-900'
                                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${type === opt.value ? 'icon-filled' : ''}`}>{opt.icon}</span>
                                    <span className="text-[9px] font-bold uppercase leading-tight">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {/* sublabel del tipo seleccionado */}
                        <p className="text-[11px] text-gray-400 mt-1.5 ml-0.5">
                            {TYPE_OPTIONS.find(o => o.value === type)?.sublabel}
                        </p>
                    </div>

                    {/* Entidad */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">¿A nombre de quién?</label>
                        <div className="flex gap-1">
                            {entities.map(en => (
                                <button
                                    key={en.id}
                                    onClick={() => { setEntityId(en.id); setAccountId('') }}
                                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${
                                        entityId === en.id
                                            ? 'border-2 text-white'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                    style={entityId === en.id ? { backgroundColor: en.color, borderColor: en.color } : {}}
                                >
                                    {en.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cuenta */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">¿De qué cuenta?</label>
                        <div className="flex gap-2">
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná una cuenta</option>
                                {filteredAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowNewAccount(true)}
                                className="px-3 py-2.5 border border-gray-300 rounded-lg text-navy-900 hover:bg-gray-50 transition-colors font-bold text-sm"
                                title="Nueva cuenta"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                        {filteredAccounts.length === 0 && entityId && (
                            <p className="text-[11px] text-amber-600 mt-1 font-medium">
                                Sin cuentas para esta entidad. Creá una con el botón +
                            </p>
                        )}
                    </div>

                    {/* Monto + Fecha */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Importe *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">¿En qué se gastó? (opcional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ej: Compra de chapas, pago luz..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Categoría */}
                    {needsCategory && (
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Tipo de gasto</label>
                            <div className="flex gap-2">
                                <select
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                >
                                    <option value="">Sin categoría</option>
                                    {categoryList.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowNewCategory(v => !v)}
                                    className={`px-3 py-2.5 border rounded-lg font-bold text-sm transition-colors ${showNewCategory ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-gray-300 text-navy-900 hover:bg-gray-50'}`}
                                    title="Nueva categoría"
                                >
                                    <span className="material-symbols-outlined text-lg">{showNewCategory ? 'close' : 'add'}</span>
                                </button>
                            </div>

                            {/* Inline new category form */}
                            {showNewCategory && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                                    <input
                                        type="text"
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        placeholder="Nombre de categoría..."
                                        autoFocus
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Color</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {CATEGORY_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewCatColor(c)}
                                                    className={`w-6 h-6 rounded-full transition-all ${newCatColor === c ? 'ring-2 ring-offset-1 ring-gray-600 scale-110' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Ícono</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {CATEGORY_ICONS.map(ci => (
                                                <button
                                                    key={ci.icon}
                                                    onClick={() => setNewCatIcon(ci.icon)}
                                                    className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border transition-all ${newCatIcon === ci.icon ? 'border-navy-900 bg-navy-50' : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <span className="material-symbols-outlined text-base">{ci.icon}</span>
                                                    <span className="text-[8px] uppercase text-gray-500">{ci.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCreateCategory}
                                        disabled={!newCatName.trim() || savingCat}
                                        className="w-full py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50"
                                    >
                                        {savingCat ? 'Guardando…' : 'Crear categoría'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Proyecto */}
                    {needsProject && (
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">¿Es de un proyecto?</label>
                            <select
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">No, es gasto general del taller</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Empleado */}
                    {needsEmployee && (
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">¿A quién le pagás?</label>
                            <select
                                value={employeeId}
                                onChange={e => setEmployeeId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná empleado</option>
                                {employees.filter(e => e.status === 'active').map(e => (
                                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Inventario */}
                    {needsInventory && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">
                                    {type === 'compra_insumo' ? '¿Qué material compraste?' : '¿Qué material usaste?'}
                                </label>
                                <select
                                    value={inventoryItemId}
                                    onChange={e => setInventoryItemId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                >
                                    <option value="">Sin ítem</option>
                                    {inventoryItems.map(i => (
                                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Cantidad</label>
                                <input
                                    type="number"
                                    value={inventoryQty}
                                    onChange={e => setInventoryQty(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.001"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-4 shrink-0 flex gap-2 border-t border-gray-100">
                    {onDelete && (
                        confirmDelete ? (
                            <div className="flex gap-2 flex-1">
                                <button onClick={onDelete} className="flex-1 py-2.5 border-2 border-red-500 bg-red-50 text-red-700 font-bold text-sm uppercase rounded-xl hover:bg-red-100 transition-colors">
                                    Confirmar
                                </button>
                                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDelete(true)} className="py-2.5 px-4 border-2 border-red-200 text-red-500 font-bold text-sm uppercase rounded-xl hover:bg-red-50 transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex-1 py-2.5 bg-navy-900 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                        {movement ? 'Guardar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>

        {/* Inline account creation modal */}
        {showNewAccount && (
            <div className="fixed inset-0 z-[60]">
                <AccountModal
                    entities={entities}
                    banks={[]}
                    onSave={handleCreateAccount}
                    onClose={() => setShowNewAccount(false)}
                />
            </div>
        )}
        </>
    )
}
