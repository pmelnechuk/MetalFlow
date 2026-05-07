import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { InventoryItem, InventoryStock } from '../types/database'

export function useInventory() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchItems = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('active', true)
            .order('name')

        if (!error) setItems((data as InventoryItem[]) || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchItems() }, [fetchItems])

    const getStock = useCallback(async (): Promise<InventoryStock[]> => {
        const { data, error } = await (supabase as any)
            .from('inventory_stock')
            .select('*')
            .order('name')

        if (error) return []
        return (data as InventoryStock[]) || []
    }, [])

    const createItem = async (data: {
        name: string
        unit: string
        stock_min?: number
        description?: string
    }) => {
        const { data: created, error } = await supabase
            .from('inventory_items')
            .insert({
                name: data.name,
                unit: data.unit,
                stock_min: data.stock_min ?? 0,
                description: data.description || null,
            })
            .select()
            .single()

        if (error) { console.error(error); return null }
        await fetchItems()
        return created as InventoryItem
    }

    const updateItem = async (id: string, updates: Partial<Pick<InventoryItem, 'name' | 'unit' | 'stock_min' | 'description' | 'active'>>) => {
        const { error } = await supabase.from('inventory_items').update(updates).eq('id', id)
        if (error) { console.error(error); return false }
        await fetchItems()
        return true
    }

    const deleteItem = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        const { error } = await supabase.from('inventory_items').update({ active: false }).eq('id', id)
        if (error) return { ok: false, error: 'Error al eliminar.' }
        await fetchItems()
        return { ok: true }
    }

    return {
        items,
        loading,
        fetchItems,
        getStock,
        createItem,
        updateItem,
        deleteItem,
    }
}
