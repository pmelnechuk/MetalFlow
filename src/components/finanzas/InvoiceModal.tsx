import { useState, useCallback } from 'react'
import type {
    Account, Entity, ExpenseCategory, InventoryItem, CreditCard, Supplier
} from '../../types/database'
import { extractReceiptFromImage, type ReceiptItem } from '../../lib/gemini'
import { ReceiptUploader } from './ReceiptUploader'
import { formatCurrency } from '../../lib/utils'

interface LineItem {
    name: string
    quantity: string
    unit: string
    unit_price: string
    inventoryItemId: string
    isNew: boolean
    newStockMin: string
    newDescription: string
}

interface Props {
    accounts: Account[]
    entities: Entity[]
    categories: ExpenseCategory[]
    inventoryItems: InventoryItem[]
    creditCards: CreditCard[]
    suppliers: Supplier[]
    projects: { id: string; name: string; client: string }[]
    onSave: (data: {
        receiptFile?: File
        supplierId?: string
        supplierName?: string
        date: string
        items: {
            inventoryItemId?: string
            newItem?: { name: string; unit: string; stock_min: number; description?: string }
            quantity: number
            unit_price: number
            name: string
        }[]
        total: number
        categoryId?: string
        projectId?: string
        paymentMode: 'account' | 'card'
        accountId?: string
        entityId?: string
        cardId?: string
        numInstallments?: number
        notes?: string
    }) => void
    onClose: () => void
}

function makeLineItem(item?: Partial<LineItem>): LineItem {
    return {
        name: item?.name ?? '',
        quantity: item?.quantity ?? '1',
        unit: item?.unit ?? 'u',
        unit_price: item?.unit_price ?? '',
        inventoryItemId: item?.inventoryItemId ?? '',
        isNew: item?.isNew ?? false,
        newStockMin: item?.newStockMin ?? '0',
        newDescription: item?.newDescription ?? '',
    }
}

export function InvoiceModal({
    accounts, entities, categories, inventoryItems,
    creditCards, suppliers, projects,
    onSave, onClose
}: Props) {
    const [step, setStep] = useState<'upload' | 'review'>('upload')
    const [receiptFile, setReceiptFile] = useState<File | undefined>()
    const [previewUrl, setPreviewUrl] = useState<string | undefined>()
    const [extracting, setExtracting] = useState(false)
    const [extractError, setExtractError] = useState('')

    // Form state
    const [supplierName, setSupplierName] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [lines, setLines] = useState<LineItem[]>([makeLineItem()])
    const [categoryId, setCategoryId] = useState('')
    const [projectId, setProjectId] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMode, setPaymentMode] = useState<'account' | 'card'>('account')
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
    const [cardId, setCardId] = useState(creditCards.filter(c => c.active)[0]?.id ?? '')
    const [numInstallments, setNumInstallments] = useState('1')
    const [saving, setSaving] = useState(false)

    const activeCards = creditCards.filter(c => c.active)
    const hasCards = activeCards.length > 0
    const hasAccounts = accounts.length > 0

    const total = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0)
    const selectedAccount = accounts.find(a => a.id === accountId)

    const handleFileSelected = useCallback(async (file: File, url: string) => {
        setReceiptFile(file)
        setPreviewUrl(url)
        setExtracting(true)
        setExtractError('')
        try {
            const result = await extractReceiptFromImage(file)
            if (result.supplier_name) setSupplierName(result.supplier_name)
            if (result.date) setDate(result.date)
            if (result.notes) setNotes(result.notes)
            if (result.items.length > 0) {
                setLines(result.items.map((it: ReceiptItem) => {
                    const found = inventoryItems.find(
                        inv => inv.name.toLowerCase().includes(it.name.toLowerCase().split(' ')[0])
                    )
                    return makeLineItem({
                        name: it.name,
                        quantity: String(it.quantity),
                        unit: it.unit,
                        unit_price: String(it.unit_price),
                        inventoryItemId: found?.id ?? '',
                        isNew: false,
                    })
                }))
            }
            setStep('review')
        } catch (e: any) {
            setExtractError(e.message || 'No se pudo analizar la imagen.')
            setStep('review')
        } finally {
            setExtracting(false)
        }
    }, [inventoryItems])

    const skipUpload = () => {
        setStep('review')
    }

    const updateLine = (idx: number, patch: Partial<LineItem>) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
    }

    const addLine = () => setLines(prev => [...prev, makeLineItem()])
    const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

    const canSave = lines.some(l => l.name.trim() && parseFloat(l.quantity) > 0 && parseFloat(l.unit_price) >= 0)

    const handleSave = async () => {
        setSaving(true)
        const itemsData = lines
            .filter(l => l.name.trim() && parseFloat(l.quantity) > 0)
            .map(l => ({
                inventoryItemId: !l.isNew && l.inventoryItemId ? l.inventoryItemId : undefined,
                newItem: l.isNew ? {
                    name: l.name.trim(),
                    unit: l.unit,
                    stock_min: parseFloat(l.newStockMin) || 0,
                    description: l.newDescription.trim() || undefined,
                } : undefined,
                quantity: parseFloat(l.quantity),
                unit_price: parseFloat(l.unit_price) || 0,
                name: l.name.trim(),
            }))

        await onSave({
            receiptFile,
            supplierId: supplierId || undefined,
            supplierName: supplierName.trim() || undefined,
            date,
            items: itemsData,
            total,
            categoryId: categoryId || undefined,
            projectId: projectId || undefined,
            paymentMode,
            accountId: paymentMode === 'account' ? accountId : undefined,
            entityId: paymentMode === 'account' ? selectedAccount?.entity_id : activeCards.find(c => c.id === cardId)?.entity_id,
            cardId: paymentMode === 'card' ? cardId : undefined,
            numInstallments: paymentMode === 'card' ? parseInt(numInstallments) || 1 : undefined,
            notes: notes.trim() || undefined,
        })
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-orange-600 icon-filled">receipt_long</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight">Cargar Factura</h2>
                        {step === 'review' && (
                            <p className="text-xs text-gray-400">Revisá y confirmá los datos</p>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* STEP: upload */}
                    {step === 'upload' && (
                        <>
                            <ReceiptUploader
                                onFileSelected={handleFileSelected}
                                previewUrl={previewUrl}
                                loading={extracting}
                                label="Subir foto de factura"
                            />
                            {extractError && (
                                <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{extractError}</p>
                            )}
                            <button
                                onClick={skipUpload}
                                className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-xs uppercase rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
                            >
                                Cargar manualmente sin foto
                            </button>
                        </>
                    )}

                    {/* STEP: review */}
                    {step === 'review' && (
                        <>
                            {/* Receipt preview small */}
                            {previewUrl && (
                                <div className="flex gap-3 items-start">
                                    <img src={previewUrl} alt="Factura" className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                    <div className="flex-1">
                                        {extractError && (
                                            <p className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                IA no pudo leer la imagen. Completá los datos manualmente.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Proveedor */}
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proveedor</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={supplierName}
                                        onChange={e => { setSupplierName(e.target.value); setSupplierId('') }}
                                        placeholder="Nombre del proveedor..."
                                        list="invoice-suppliers"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                    />
                                    <datalist id="invoice-suppliers">
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha *</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Ítems *</label>
                                    <button
                                        onClick={addLine}
                                        className="text-[10px] font-bold uppercase text-navy-700 hover:text-navy-900 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Agregar
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {lines.map((line, idx) => {
                                        const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)
                                        return (
                                            <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2">
                                                {/* Name + inventory match */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={line.name}
                                                        onChange={e => updateLine(idx, { name: e.target.value })}
                                                        placeholder="Nombre del ítem"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                    />
                                                    {lines.length > 1 && (
                                                        <button
                                                            onClick={() => removeLine(idx)}
                                                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Qty + unit + price */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            value={line.quantity}
                                                            onChange={e => updateLine(idx, { quantity: e.target.value })}
                                                            min="0" step="0.001"
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">Unidad</label>
                                                        <input
                                                            type="text"
                                                            value={line.unit}
                                                            onChange={e => updateLine(idx, { unit: e.target.value })}
                                                            list="units-list"
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">P. unitario</label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">$</span>
                                                            <input
                                                                type="number"
                                                                value={line.unit_price}
                                                                onChange={e => updateLine(idx, { unit_price: e.target.value })}
                                                                min="0" step="0.01"
                                                                className="w-full pl-4 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Inventory link */}
                                                <div>
                                                    <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">Vincular a inventario</label>
                                                    <select
                                                        value={line.isNew ? '__new__' : line.inventoryItemId}
                                                        onChange={e => {
                                                            const v = e.target.value
                                                            if (v === '__new__') updateLine(idx, { isNew: true, inventoryItemId: '' })
                                                            else updateLine(idx, { isNew: false, inventoryItemId: v })
                                                        }}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                    >
                                                        <option value="">Sin inventario</option>
                                                        {inventoryItems.map(inv => (
                                                            <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                                        ))}
                                                        <option value="__new__">+ Crear nuevo ítem</option>
                                                    </select>
                                                </div>

                                                {/* New item fields */}
                                                {line.isNew && (
                                                    <div className="bg-blue-50 rounded-lg p-2 space-y-2">
                                                        <p className="text-[10px] font-bold text-blue-700 uppercase">Nuevo ítem de inventario</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">Stock mínimo</label>
                                                                <input
                                                                    type="number"
                                                                    value={line.newStockMin}
                                                                    onChange={e => updateLine(idx, { newStockMin: e.target.value })}
                                                                    min="0"
                                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 block">Descripción</label>
                                                                <input
                                                                    type="text"
                                                                    value={line.newDescription}
                                                                    onChange={e => updateLine(idx, { newDescription: e.target.value })}
                                                                    placeholder="Opcional"
                                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {lineTotal > 0 && (
                                                    <p className="text-right text-[10px] font-bold text-gray-500">
                                                        Subtotal: <span className="text-navy-900">{formatCurrency(lineTotal)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <datalist id="units-list">
                                    {['u', 'kg', 'm', 'm2', 'lt', 'pack', 'caja', 'rollo', 'bolsa'].map(u => <option key={u} value={u} />)}
                                </datalist>
                            </div>

                            {/* Total */}
                            <div className="bg-navy-50 rounded-xl px-4 py-3 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-navy-600 tracking-wider">Total factura</span>
                                <span className="text-2xl font-black text-navy-900">{formatCurrency(total)}</span>
                            </div>

                            {/* Categoría + Proyecto */}
                            <div className="grid grid-cols-2 gap-3">
                                {categories.length > 0 && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Categoría</label>
                                        <select
                                            value={categoryId}
                                            onChange={e => setCategoryId(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            <option value="">Sin categoría</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {projects.length > 0 && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                                        <select
                                            value={projectId}
                                            onChange={e => setProjectId(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            <option value="">Sin proyecto</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Payment */}
                            {(hasAccounts || hasCards) && (
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">Forma de pago</label>
                                    {hasAccounts && hasCards && (
                                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
                                            <button
                                                onClick={() => setPaymentMode('account')}
                                                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${paymentMode === 'account' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}
                                            >
                                                Cuenta / Efectivo
                                            </button>
                                            <button
                                                onClick={() => setPaymentMode('card')}
                                                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${paymentMode === 'card' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}
                                            >
                                                Tarjeta crédito
                                            </button>
                                        </div>
                                    )}
                                    {paymentMode === 'account' && hasAccounts && (
                                        <select
                                            value={accountId}
                                            onChange={e => setAccountId(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    )}
                                    {paymentMode === 'card' && hasCards && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={cardId}
                                                onChange={e => setCardId(e.target.value)}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                            >
                                                {activeCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div>
                                                <input
                                                    type="number"
                                                    value={numInstallments}
                                                    onChange={e => setNumInstallments(e.target.value)}
                                                    min="1" max="60"
                                                    placeholder="Cuotas"
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notas */}
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Notas</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Observaciones opcionales..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                    {step === 'review' && (
                        <button
                            onClick={() => setStep('upload')}
                            className="py-2.5 px-4 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                    )}
                    <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    {step === 'review' && (
                        <button
                            onClick={handleSave}
                            disabled={!canSave || saving}
                            className="flex-1 py-2.5 bg-orange-600 text-white font-bold text-sm uppercase rounded-xl shadow hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                            )}
                            Guardar factura
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
