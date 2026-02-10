import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TaskAttachment {
    id: string
    task_id: string
    filename: string
    storage_path: string
    mime_type: string
    size_bytes: number | null
    created_at: string
}

export function useAttachments(taskId: string | null) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const fetchAttachments = useCallback(async () => {
        if (!taskId) return
        setLoading(true)
        const { data } = await (supabase
            .from('task_attachments') as any)
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: false })
        setAttachments((data as TaskAttachment[]) || [])
        setLoading(false)
    }, [taskId])

    useEffect(() => {
        fetchAttachments()
    }, [fetchAttachments])

    const uploadAttachment = async (file: File) => {
        if (!taskId) return
        setUploading(true)
        try {
            const ext = file.name.split('.').pop() || 'jpg'
            const path = `${taskId}/${crypto.randomUUID()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(path, file)

            if (uploadError) {
                console.error('[Upload error]', uploadError)
                setUploading(false)
                return
            }

            const { data, error } = await (supabase
                .from('task_attachments') as any)
                .insert({
                    task_id: taskId,
                    filename: file.name,
                    storage_path: path,
                    mime_type: file.type || 'application/octet-stream',
                    size_bytes: file.size,
                })
                .select('*')
                .single()

            if (!error && data) {
                setAttachments(prev => [data as TaskAttachment, ...prev])
            }
        } catch (err) {
            console.error('[Upload exception]', err)
        }
        setUploading(false)
    }

    const deleteAttachment = async (att: TaskAttachment) => {
        await supabase.storage.from('task-attachments').remove([att.storage_path])
        await (supabase.from('task_attachments') as any).delete().eq('id', att.id)
        setAttachments(prev => prev.filter(a => a.id !== att.id))
    }

    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from('task-attachments').getPublicUrl(path)
        return data.publicUrl
    }

    return { attachments, loading, uploading, uploadAttachment, deleteAttachment, getPublicUrl, refetch: fetchAttachments }
}
