import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ExpenseCategory } from '../types/database'

export function useExpenseCategories() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('expense_categories')
            .select('*')
            .order('name')
            .then(({ data, error }) => {
                if (!error) setCategories((data as ExpenseCategory[]) || [])
                setLoading(false)
            })
    }, [])

    return { categories, loading }
}
