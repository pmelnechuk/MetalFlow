import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { InstallmentPurchase, Installment, UpcomingInstallment } from '../types/database'

function addMonths(date: Date, months: number): Date {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d
}

function toDateStr(date: Date): string {
    return date.toISOString().split('T')[0]
}

export function useInstallments() {
    const createInstallmentPurchase = useCallback(async (data: {
        credit_card_id: string
        purchase_id?: string
        description: string
        total_amount: number
        num_installments: number
        first_due_date: string
        category_id?: string
        project_id?: string
    }): Promise<InstallmentPurchase | null> => {
        const installment_amt = Math.ceil((data.total_amount / data.num_installments) * 100) / 100

        const { data: ip, error } = await supabase
            .from('installment_purchases')
            .insert({
                credit_card_id: data.credit_card_id,
                purchase_id: data.purchase_id ?? null,
                description: data.description,
                total_amount: data.total_amount,
                num_installments: data.num_installments,
                installment_amt,
                first_due_date: data.first_due_date,
                category_id: data.category_id ?? null,
                project_id: data.project_id ?? null,
            })
            .select()
            .single()

        if (error) { console.error(error); return null }
        const purchase = ip as InstallmentPurchase

        // Create individual installments
        const firstDate = new Date(data.first_due_date)
        const installments = Array.from({ length: data.num_installments }, (_, i) => ({
            installment_purchase_id: purchase.id,
            installment_number: i + 1,
            amount: installment_amt,
            due_date: toDateStr(addMonths(firstDate, i)),
        }))

        const { error: instError } = await supabase.from('installments').insert(installments)
        if (instError) { console.error(instError) }

        return purchase
    }, [])

    const payInstallment = useCallback(async (
        installmentId: string,
        movementId: string,
    ): Promise<boolean> => {
        const today = new Date().toISOString().split('T')[0]
        const { error } = await supabase
            .from('installments')
            .update({ status: 'pagado', paid_at: today, movement_id: movementId })
            .eq('id', installmentId)
        if (error) { console.error(error); return false }
        return true
    }, [])

    const getUpcomingInstallments = useCallback(async (): Promise<UpcomingInstallment[]> => {
        const db = supabase as any
        const { data, error } = await db
            .from('upcoming_installments')
            .select('*')
        if (error) { console.error(error); return [] }
        return (data || []) as UpcomingInstallment[]
    }, [])

    const getInstallmentsByPurchase = useCallback(async (purchaseId: string): Promise<Installment[]> => {
        const { data, error } = await supabase
            .from('installments')
            .select('*')
            .eq('installment_purchase_id', purchaseId)
            .order('installment_number')
        if (error) { console.error(error); return [] }
        return (data as Installment[]) || []
    }, [])

    const updateOverdueInstallments = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0]
        await supabase
            .from('installments')
            .update({ status: 'vencido' })
            .eq('status', 'pendiente')
            .lt('due_date', today)
    }, [])

    const cancelInstallmentPurchase = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('installment_purchases')
            .update({ status: 'cancelado' })
            .eq('id', id)
        if (error) { console.error(error); return false }
        return true
    }, [])

    return {
        createInstallmentPurchase,
        payInstallment,
        getUpcomingInstallments,
        getInstallmentsByPurchase,
        updateOverdueInstallments,
        cancelInstallmentPurchase,
    }
}
