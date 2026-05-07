import { useState, useEffect } from 'react'
import type { Movement, MovementType, Account, ExpenseCategory, InventoryItem, Entity } from '../../types/database'
import type { Employee, Project } from '../../types/database'

const TYPE_OPTIONS: { value: MovementType; label: string; icon: string }[] = [
    { value: 'gasto',          label: 'Gasto general',    icon: 'payments' },
    { value: 'ingreso',        label: 'Ingreso',          icon: 'trending_up' },
    { value: 'compra_insumo',  label: 'Compra insumo',    icon: 'inventory_2' },
    { value: 'pago_sueldo',    label: 'Pago sueldo',      icon: 'badge' },
    { value: 'consumo_insumo', label: 'Consumo insumo',   icon: 'remove_circle' },
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
}

export function MovementModal({
    movement, accounts, categories, inventoryItems, employees, projects, entities, onSave, onClose, onDelete,
}: Props) {
    const [type, setType] = useState<MovementType>(movement?.type ?? 'gasto')
    const [amount, setAmount] = useState(movement ? String(Math.abs(movement.amount)) : '')
    const [date, setDate] = useState(movement?.date ?? new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState(movement?.description ?? '')
    const [accountId, setAccountId] = useState(movement?.account_id ?? (accounts[0]?.id ?? ''))
    const [entityId, setEntityId] = useState(movement?.entity_id ?? (entities[0]?.id ?? ''))
    const [categoryId, setCategoryId] = useState(movement?.category_id ?? '')
    const [projectId, setProjectId] = useState(movement?.project_id ?? '')
    const [employeeId, setEmployeeId] = useState(movement?.employee_id ?? '')
    const [inventoryItemId, setInventoryItemId] = useState(movement?.inventory_item_id ?? '')
    const [inventoryQty, setInventoryQty] = useState(movement?.inventory_qty != null ? String(movement.inventory_qty) : '')
    const [confirmDelete, setConfirmDelete] = useState(false)

    // Sync entity when account changes
    useEffect(() => {
        const acct = accounts.find(a => a.id === accountId)
        if (acct) setEntityId(acct.entity_id)
    }, [accountId, accounts])

    const filteredAccounts = entityId
        ? accounts.filter(a => a.entity_id === entityId)
        : accounts

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
            category_id: categoryId || undefined,
            project_id: projectId || undefined,
            employee_id: needsEmployee ? (employeeId || undefined) : undefined,
            inventory_item_id: needsInventory ? (inventoryItemId || undefined) : undefined,
            inventory_qty: needsInventory && inventoryQty ? parseFloat(inventoryQty) : undefined,
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 shrink-0">
                    <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                        <span className="material-symbols-outlined text-2xl icon-filled">account_balance_wallet</span>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex-1">
                        {movement ? 'Editar movimiento' : 'Nuevo movimiento'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Tipo */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">Tipo *</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setType(opt.value)}
                                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                                        type === opt.value
                                            ? 'border-navy-900 bg-navy-50 text-navy-900'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${type === opt.value ? 'icon-filled' : ''}`}>{opt.icon}</span>
                                    <span className="text-[10px] font-bold uppercase leading-tight">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Entidad + Cuenta */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Entidad *</label>
                            <select
                                value={entityId}
                                onChange={e => { setEntityId(e.target.value); setAccountId('') }}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná</option>
                                {entities.map(en => (
                                    <option key={en.id} value={en.id}>{en.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Cuenta *</label>
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná</option>
                                {filteredAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Monto + Fecha */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Monto *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha *</label>
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
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalle opcional..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Categoría */}
                    {needsCategory && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Categoría</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Proyecto */}
                    {needsProject && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                            <select
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Gasto general (sin proyecto)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Empleado */}
                    {needsEmployee && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Empleado</label>
                            <select
                                value={employeeId}
                                onChange={e => setEmployeeId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            >
                                <option value="">Seleccioná empleado</option>
                                {employees.filter(e => e.status === 'activo').map(e => (
                                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Inventario */}
                    {needsInventory && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">
                                    {type === 'compra_insumo' ? 'Ítem comprado' : 'Ítem consumido'}
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
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Cantidad</label>
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
                <div className="px-6 pb-5 pt-4 shrink-0 flex gap-2 border-t border-gray-100">
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
    )
}
