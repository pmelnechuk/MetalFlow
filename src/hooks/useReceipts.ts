import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Receipt } from '../types/database'

const BUCKET = 'receipts'

export function useReceipts() {
    const uploadReceipt = useCallback(async (
        file: File,
        contextId: string,
    ): Promise<{ storage_path: string; public_url: string } | null> => {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${contextId}/${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false })

        if (error) { console.error(error); return null }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        return { storage_path: path, public_url: urlData.publicUrl }
    }, [])

    const saveReceiptRecord = useCallback(async (data: {
        movement_id?: string
        installment_purchase_id?: string
        storage_path: string
        filename: string
        mime_type?: string
        size_bytes?: number
    }): Promise<Receipt | null> => {
        const { data: rec, error } = await supabase
            .from('receipts')
            .insert(data)
            .select()
            .single()
        if (error) { console.error(error); return null }
        return rec as Receipt
    }, [])

    const getReceiptsForMovement = useCallback(async (movementId: string): Promise<Receipt[]> => {
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('movement_id', movementId)
            .order('created_at')
        if (error) { console.error(error); return [] }
        return (data as Receipt[]) || []
    }, [])

    const getReceiptsForInstallmentPurchase = useCallback(async (ipId: string): Promise<Receipt[]> => {
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('installment_purchase_id', ipId)
            .order('created_at')
        if (error) { console.error(error); return [] }
        return (data as Receipt[]) || []
    }, [])

    const getPublicUrl = useCallback((path: string): string => {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        return data.publicUrl
    }, [])

    const deleteReceipt = useCallback(async (receipt: Receipt): Promise<boolean> => {
        await supabase.storage.from(BUCKET).remove([receipt.storage_path])
        const { error } = await supabase.from('receipts').delete().eq('id', receipt.id)
        if (error) { console.error(error); return false }
        return true
    }, [])

    return {
        uploadReceipt,
        saveReceiptRecord,
        getReceiptsForMovement,
        getReceiptsForInstallmentPurchase,
        getPublicUrl,
        deleteReceipt,
    }
}
