import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Account, AccountWithBalance } from '../types/database'

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('active', true)
            .order('name')

        if (!error) setAccounts((data as Account[]) || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchAccounts() }, [fetchAccounts])

    const getAccountsWithBalance = useCallback(async (): Promise<AccountWithBalance[]> => {
        const { data, error } = await (supabase as any)
            .from('account_balances')
            .select('*')
            .eq('active', true)
            .order('entity_name')

        if (error) return []
        return (data as AccountWithBalance[]) || []
    }, [])

    const createAccount = async (data: {
        entity_id: string
        name: string
        type: Account['type']
        initial_balance?: number
        currency?: string
        bank_id?: string | null
        overdraft_limit?: number
        card_last4?: string | null
        card_brand?: string | null
    }) => {
        const { data: created, error } = await supabase
            .from('accounts')
            .insert({
                entity_id: data.entity_id,
                name: data.name,
                type: data.type,
                initial_balance: data.initial_balance ?? 0,
                currency: data.currency ?? 'ARS',
                bank_id: data.bank_id ?? null,
                overdraft_limit: data.overdraft_limit ?? 0,
                card_last4: data.card_last4 ?? null,
                card_brand: data.card_brand ?? null,
            })
            .select()
            .single()

        if (error) { console.error(error); return null }
        await fetchAccounts()
        return created as Account
    }

    const updateAccount = async (id: string, updates: Partial<Pick<Account,
        'name' | 'type' | 'initial_balance' | 'active' | 'bank_id' | 'overdraft_limit' | 'card_last4' | 'card_brand'
    >>) => {
        const { error } = await supabase.from('accounts').update(updates).eq('id', id)
        if (error) { console.error(error); return false }
        await fetchAccounts()
        return true
    }

    const deleteAccount = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        const { error } = await supabase.from('accounts').delete().eq('id', id)
        if (error) {
            if (error.code === '23503') return { ok: false, error: 'La cuenta tiene movimientos registrados.' }
            return { ok: false, error: 'Error al eliminar.' }
        }
        await fetchAccounts()
        return { ok: true }
    }

    return {
        accounts,
        loading,
        fetchAccounts,
        getAccountsWithBalance,
        createAccount,
        updateAccount,
        deleteAccount,
    }
}
