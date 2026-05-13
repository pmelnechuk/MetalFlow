import { createClient } from '@supabase/supabase-js'

// Test DB — uses SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY env vars.
// Falls back to dev DB if not set (runs against dev; clean up after each test).
const supabaseUrl = process.env.SUPABASE_TEST_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = process.env.SUPABASE_TEST_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

export const db = createClient(supabaseUrl, supabaseKey)

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function seedEntity(name = `TestEntity-${Date.now()}`) {
    const { data, error } = await db.from('entities').insert({ name, color: '#3b82f6' }).select().single()
    if (error) throw error
    return data as { id: string; name: string; color: string }
}

export async function seedBank(entityId: string, name = `TestBank-${Date.now()}`) {
    const { data, error } = await db.from('banks').insert({ name, short_name: name.slice(0, 8), entity_id: entityId }).select().single()
    if (error) throw error
    return data as { id: string; name: string }
}

export async function seedAccount(entityId: string, opts?: {
    name?: string
    type?: 'cash' | 'bank' | 'digital'
    initial_balance?: number
    overdraft_limit?: number
    bank_id?: string
}) {
    const { data, error } = await db.from('accounts').insert({
        entity_id: entityId,
        name: opts?.name ?? `TestAccount-${Date.now()}`,
        type: opts?.type ?? 'cash',
        initial_balance: opts?.initial_balance ?? 0,
        overdraft_limit: opts?.overdraft_limit ?? 0,
        bank_id: opts?.bank_id ?? null,
        currency: 'ARS',
    }).select().single()
    if (error) throw error
    return data as { id: string; name: string; entity_id: string }
}

export async function seedCreditCard(entityId: string, opts?: {
    name?: string
    credit_limit?: number
    closing_day?: number
    due_day?: number
    bank_id?: string
}) {
    const { data, error } = await db.from('credit_cards').insert({
        entity_id: entityId,
        name: opts?.name ?? `TestCard-${Date.now()}`,
        credit_limit: opts?.credit_limit ?? 100_000,
        closing_day: opts?.closing_day ?? 15,
        due_day: opts?.due_day ?? 25,
        bank_id: opts?.bank_id ?? null,
        currency: 'ARS',
    }).select().single()
    if (error) throw error
    return data as { id: string; name: string; credit_limit: number; due_day: number }
}

export async function seedInventoryItem(opts?: { name?: string; unit?: string; stock_min?: number }) {
    const { data, error } = await db.from('inventory_items').insert({
        name: opts?.name ?? `TestItem-${Date.now()}`,
        unit: opts?.unit ?? 'u',
        stock_min: opts?.stock_min ?? 0,
    }).select().single()
    if (error) throw error
    return data as { id: string; name: string; unit: string }
}

export async function seedMovement(entityId: string, accountId: string, amount: number, opts?: {
    type?: string
    date?: string
    inventory_item_id?: string
    inventory_qty?: number
}) {
    const { data, error } = await db.from('movements').insert({
        entity_id: entityId,
        account_id: accountId,
        type: opts?.type ?? (amount > 0 ? 'ingreso' : 'gasto'),
        amount,
        date: opts?.date ?? new Date().toISOString().split('T')[0],
        inventory_item_id: opts?.inventory_item_id ?? null,
        inventory_qty: opts?.inventory_qty ?? null,
    }).select().single()
    if (error) throw error
    return data as { id: string; amount: number }
}

export async function seedInstallmentPurchase(cardId: string, opts?: {
    description?: string
    total_amount?: number
    num_installments?: number
    first_due_date?: string
}) {
    const total = opts?.total_amount ?? 60_000
    const n = opts?.num_installments ?? 3
    const installment_amt = Math.ceil((total / n) * 100) / 100

    const firstDate = opts?.first_due_date ?? (() => {
        const d = new Date()
        d.setDate(25)
        if (d <= new Date()) d.setMonth(d.getMonth() + 1)
        return d.toISOString().split('T')[0]
    })()

    const { data: ip, error } = await db.from('installment_purchases').insert({
        credit_card_id: cardId,
        description: opts?.description ?? `TestPurchase-${Date.now()}`,
        total_amount: total,
        num_installments: n,
        installment_amt,
        first_due_date: firstDate,
    }).select().single()
    if (error) throw error

    const ipData = ip as { id: string }
    const base = new Date(firstDate + 'T00:00:00')
    const installments = Array.from({ length: n }, (_, i) => {
        const d = new Date(base)
        d.setMonth(d.getMonth() + i)
        return {
            installment_purchase_id: ipData.id,
            installment_number: i + 1,
            amount: installment_amt,
            due_date: d.toISOString().split('T')[0],
        }
    })
    await db.from('installments').insert(installments)

    return ipData
}

// ─── Cleanup helpers ──────────────────────────────────────────────────────────

export async function cleanupEntity(id: string) {
    // Delete cascade handles children
    await db.from('entities').delete().eq('id', id)
}

export async function cleanupInventoryItem(id: string) {
    await db.from('inventory_items').delete().eq('id', id)
}

export async function cleanupCreditCard(id: string) {
    await db.from('credit_cards').delete().eq('id', id)
}
