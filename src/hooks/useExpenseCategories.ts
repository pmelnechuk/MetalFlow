import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ExpenseCategory } from '../types/database'

export function useExpenseCategories() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name')
        if (!error) setCategories((data as ExpenseCategory[]) || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchCategories() }, [fetchCategories])

    const createCategory = async (data: { name: string; color: string; icon: string }) => {
        const { data: created, error } = await supabase
            .from('expense_categories')
            .insert(data)
            .select()
            .single()
        if (error) { console.error(error); return null }
        const cat = created as ExpenseCategory
        setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
        return cat
    }

    return { categories, loading, createCategory, refetch: fetchCategories }
}
