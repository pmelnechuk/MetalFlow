import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CreditCard, CreditCardBalance } from '../types/database'

export function useCreditCards() {
    const [cards, setCards] = useState<CreditCard[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCards = useCallback(async () => {
        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('active', true)
            .order('name')
        if (!error) setCards((data as CreditCard[]) || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchCards() }, [fetchCards])

    const getCardsWithBalance = async (): Promise<CreditCardBalance[]> => {
        const db = supabase as any
        const { data, error } = await db
            .from('credit_card_balances')
            .select('*')
            .eq('active', true)
            .order('name')
        if (error) { console.error(error); return [] }
        return (data || []) as CreditCardBalance[]
    }

    const createCard = async (data: Omit<CreditCard, 'id' | 'created_at'>) => {
        const { data: created, error } = await supabase
            .from('credit_cards')
            .insert(data)
            .select()
            .single()
        if (error) { console.error(error); return null }
        const card = created as CreditCard
        setCards(prev => [...prev, card].sort((a, b) => a.name.localeCompare(b.name)))
        return card
    }

    const updateCard = async (id: string, updates: Partial<CreditCard>) => {
        const { data, error } = await supabase
            .from('credit_cards')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) { console.error(error); return null }
        const card = data as CreditCard
        setCards(prev => prev.map(c => c.id === id ? card : c))
        return card
    }

    const deleteCard = async (id: string) => {
        const { error } = await supabase.from('credit_cards').update({ active: false }).eq('id', id)
        if (error) { console.error(error); return false }
        setCards(prev => prev.filter(c => c.id !== id))
        return true
    }

    return { cards, loading, getCardsWithBalance, createCard, updateCard, deleteCard, refetch: fetchCards }
}
