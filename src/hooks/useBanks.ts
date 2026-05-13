import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Bank } from '../types/database'

export function useBanks() {
    const [banks, setBanks] = useState<Bank[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBanks = useCallback(async () => {
        const { data, error } = await supabase
            .from('banks')
            .select('*')
            .eq('active', true)
            .order('name')
        if (!error) setBanks((data as Bank[]) || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchBanks() }, [fetchBanks])

    const createBank = async (data: { name: string; short_name?: string; entity_id?: string }) => {
        const { data: created, error } = await supabase
            .from('banks')
            .insert(data)
            .select()
            .single()
        if (error) { console.error(error); return null }
        const bank = created as Bank
        setBanks(prev => [...prev, bank].sort((a, b) => a.name.localeCompare(b.name)))
        return bank
    }

    const updateBank = async (id: string, updates: Partial<Bank>) => {
        const { data, error } = await supabase
            .from('banks')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) { console.error(error); return null }
        const bank = data as Bank
        setBanks(prev => prev.map(b => b.id === id ? bank : b))
        return bank
    }

    const deleteBank = async (id: string) => {
        const { error } = await supabase.from('banks').update({ active: false }).eq('id', id)
        if (error) { console.error(error); return false }
        setBanks(prev => prev.filter(b => b.id !== id))
        return true
    }

    return { banks, loading, createBank, updateBank, deleteBank, refetch: fetchBanks }
}
