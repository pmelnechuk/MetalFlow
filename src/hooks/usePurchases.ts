import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Purchase, PurchaseStatus } from '../types/database'

export function usePurchases() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'todas'>('todas')
    const [supplierFilter, setSupplierFilter] = useState<string | null>(null)

    const fetchPurchases = useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('purchases')
            .select('*, supplier:suppliers(id, name, category), project:projects(id, name, client)')
            .order('created_at', { ascending: false })

        if (statusFilter !== 'todas') {
            query = query.eq('status', statusFilter)
        }
        if (supplierFilter) {
            query = query.eq('supplier_id', supplierFilter)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching purchases:', error)
        } else {
            setPurchases((data as unknown as Purchase[]) || [])
        }
        setLoading(false)
    }, [statusFilter, supplierFilter])

    useEffect(() => {
        fetchPurchases()
    }, [fetchPurchases])

    const createPurchase = async (data: {
        description: string
        quantity?: number
        unit?: string
        supplier_id?: string
        project_id?: string
        notes?: string
    }) => {
        const { data: created, error } = await supabase
            .from('purchases')
            .insert({
                description: data.description,
                quantity: data.quantity ?? 1,
                unit: data.unit || null,
                supplier_id: data.supplier_id || null,
                project_id: data.project_id || null,
                notes: data.notes || null,
                status: 'pendiente',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating purchase:', error)
            return null
        }
        await fetchPurchases()
        return created
    }

    const updatePurchase = async (id: string, updates: Partial<Purchase>) => {
        const { error } = await supabase
            .from('purchases')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating purchase:', error)
            return false
        }
        await fetchPurchases()
        return true
    }

    const markAsBought = async (id: string, unit_price: number) => {
        const today = new Date().toISOString().split('T')[0]
        return updatePurchase(id, {
            status: 'comprado',
            unit_price,
            date_purchased: today,
        } as any)
    }

    const deletePurchase = async (id: string) => {
        const { error } = await supabase
            .from('purchases')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting purchase:', error)
            return false
        }
        await fetchPurchases()
        return true
    }

    return {
        purchases,
        loading,
        statusFilter,
        setStatusFilter,
        supplierFilter,
        setSupplierFilter,
        createPurchase,
        updatePurchase,
        markAsBought,
        deletePurchase,
        refetch: fetchPurchases,
    }
}
