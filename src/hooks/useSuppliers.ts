import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Supplier, SupplierWithStats } from '../types/database'

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSuppliers = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching suppliers:', error)
        } else {
            setSuppliers((data as Supplier[]) || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchSuppliers()
    }, [fetchSuppliers])

    const createSupplier = async (data: { name: string; category?: string; phone?: string; notes?: string }) => {
        const { data: created, error } = await supabase
            .from('suppliers')
            .insert({
                name: data.name,
                category: data.category || 'otro',
                phone: data.phone || null,
                notes: data.notes || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating supplier:', error)
            return null
        }
        setSuppliers(prev => [...prev, created as Supplier].sort((a, b) => a.name.localeCompare(b.name)))
        return created as Supplier
    }

    const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
        const { data: updated, error } = await supabase
            .from('suppliers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating supplier:', error)
            return false
        }
        setSuppliers(prev => prev.map(s => s.id === id ? (updated as Supplier) : s))
        return true
    }

    const deleteSupplier = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id)

        if (error) {
            if (error.code === '23503') {
                return { ok: false, error: 'No se puede eliminar: este proveedor tiene compras registradas.' }
            }
            console.error('Error deleting supplier:', error)
            return { ok: false, error: 'Error al eliminar el proveedor.' }
        }
        setSuppliers(prev => prev.filter(s => s.id !== id))
        return { ok: true }
    }

    const getSuppliersWithStats = useCallback(async (): Promise<SupplierWithStats[]> => {
        const { data: suppliersData, error: suppliersError } = await supabase
            .from('suppliers')
            .select('*')
            .order('name')

        if (suppliersError || !suppliersData) return []

        const { data: purchasesData } = await supabase
            .from('purchases')
            .select('supplier_id, unit_price, quantity, date_purchased, status')
            .eq('status', 'comprado')

        const statsMap = new Map<string, { total_spent: number; purchase_count: number; last_purchase_date: string | null }>()

        for (const p of (purchasesData || [])) {
            const existing = statsMap.get(p.supplier_id) || { total_spent: 0, purchase_count: 0, last_purchase_date: null }
            existing.total_spent += (p.unit_price ?? 0) * (p.quantity ?? 1)
            existing.purchase_count += 1
            if (!existing.last_purchase_date || (p.date_purchased && p.date_purchased > existing.last_purchase_date)) {
                existing.last_purchase_date = p.date_purchased
            }
            statsMap.set(p.supplier_id, existing)
        }

        return (suppliersData as Supplier[]).map(s => ({
            ...s,
            total_spent: statsMap.get(s.id)?.total_spent ?? 0,
            purchase_count: statsMap.get(s.id)?.purchase_count ?? 0,
            last_purchase_date: statsMap.get(s.id)?.last_purchase_date ?? null,
        })).sort((a, b) => b.total_spent - a.total_spent)
    }, [])

    return {
        suppliers,
        loading,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        getSuppliersWithStats,
        refetch: fetchSuppliers,
    }
}
