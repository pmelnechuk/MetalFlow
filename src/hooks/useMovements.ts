import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Movement, MovementType } from '../types/database'

export interface MovementFilters {
    type?: MovementType | 'todos'
    account_id?: string | null
    entity_id?: string | null
    project_id?: string | null
    date_from?: string | null
    date_to?: string | null
}

const MOVEMENT_SELECT = `
  *,
  account:accounts(id, name, type, entity:entities(id, name, color)),
  category:expense_categories(id, name, color, icon),
  project:projects(id, name, client),
  employee:employees(id, first_name, last_name),
  inventory_item:inventory_items(id, name, unit)
`

export function useMovements(initialFilters: MovementFilters = {}) {
    const [movements, setMovements] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<MovementFilters>(initialFilters)

    const fetchMovements = useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('movements')
            .select(MOVEMENT_SELECT)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (filters.type && filters.type !== 'todos') query = query.eq('type', filters.type)
        if (filters.account_id) query = query.eq('account_id', filters.account_id)
        if (filters.entity_id) query = query.eq('entity_id', filters.entity_id)
        if (filters.project_id) query = query.eq('project_id', filters.project_id)
        if (filters.date_from) query = query.gte('date', filters.date_from)
        if (filters.date_to) query = query.lte('date', filters.date_to)

        // Exclude transfer pair legs from main list to avoid duplication
        // (show only the outgoing leg, pair is visible in detail)

        const { data, error } = await query
        if (!error) setMovements((data as unknown as Movement[]) || [])
        setLoading(false)
    }, [filters])

    useEffect(() => { fetchMovements() }, [fetchMovements])

    const createMovement = async (data: {
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
        purchase_id?: string
    }) => {
        const signedAmount = signAmount(data.type, data.amount)

        const { data: created, error } = await supabase
            .from('movements')
            .insert({
                entity_id: data.entity_id,
                account_id: data.account_id,
                type: data.type,
                amount: signedAmount,
                date: data.date,
                description: data.description || null,
                category_id: data.category_id || null,
                project_id: data.project_id || null,
                employee_id: data.employee_id || null,
                inventory_item_id: data.inventory_item_id || null,
                inventory_qty: data.inventory_qty ?? null,
                purchase_id: data.purchase_id || null,
            })
            .select()
            .single()

        if (error) { console.error(error); return null }
        await fetchMovements()
        return created
    }

    const createTransfer = async (data: {
        entity_id: string
        from_account_id: string
        to_account_id: string
        amount: number
        date: string
        description?: string
    }) => {
        type MovRow = { id: string }

        // Insert outgoing leg
        const { data: outLeg, error: e1 } = await supabase
            .from('movements')
            .insert({
                entity_id: data.entity_id,
                account_id: data.from_account_id,
                type: 'transferencia',
                amount: -Math.abs(data.amount),
                date: data.date,
                description: data.description || null,
            })
            .select('id')
            .single()

        if (e1 || !outLeg) { console.error(e1); return null }
        const outRow = outLeg as unknown as MovRow

        // Insert incoming leg
        const { data: inLeg, error: e2 } = await supabase
            .from('movements')
            .insert({
                entity_id: data.entity_id,
                account_id: data.to_account_id,
                type: 'transferencia',
                amount: Math.abs(data.amount),
                date: data.date,
                description: data.description || null,
                transfer_pair_id: outRow.id,
            })
            .select('id')
            .single()

        if (e2 || !inLeg) { console.error(e2); return null }
        const inRow = inLeg as unknown as MovRow

        // Link outgoing to incoming
        await supabase.from('movements').update({ transfer_pair_id: inRow.id }).eq('id', outRow.id)

        await fetchMovements()
        return { outLeg: outRow, inLeg: inRow }
    }

    const updateMovement = async (id: string, updates: {
        amount?: number
        date?: string
        description?: string
        category_id?: string | null
        project_id?: string | null
        employee_id?: string | null
        inventory_item_id?: string | null
        inventory_qty?: number | null
    }) => {
        const existing = movements.find(m => m.id === id)
        const payload: Record<string, unknown> = { ...updates }

        if (updates.amount !== undefined && existing) {
            payload.amount = signAmount(existing.type, updates.amount)
        }

        const { error } = await supabase.from('movements').update(payload).eq('id', id)
        if (error) { console.error(error); return false }
        await fetchMovements()
        return true
    }

    const deleteMovement = async (id: string) => {
        const movement = movements.find(m => m.id === id)

        // If transfer, delete both legs
        if (movement?.type === 'transferencia' && movement.transfer_pair_id) {
            await supabase.from('movements').update({ transfer_pair_id: null }).eq('id', id)
            await supabase.from('movements').update({ transfer_pair_id: null }).eq('id', movement.transfer_pair_id)
            await supabase.from('movements').delete().eq('id', movement.transfer_pair_id)
        }

        const { error } = await supabase.from('movements').delete().eq('id', id)
        if (error) { console.error(error); return false }
        await fetchMovements()
        return true
    }

    return {
        movements,
        loading,
        filters,
        setFilters,
        fetchMovements,
        createMovement,
        createTransfer,
        updateMovement,
        deleteMovement,
    }
}

function signAmount(type: MovementType, amount: number): number {
    const positive: MovementType[] = ['ingreso']
    return positive.includes(type) ? Math.abs(amount) : -Math.abs(amount)
}
