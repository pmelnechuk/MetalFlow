import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskAttachment } from '../types/database'

export function useAttachments(taskId: string | null) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const fetchAttachments = useCallback(async () => {
        if (!taskId) return
        setLoading(true)
        const { data } = await supabase
            .from('task_attachments')
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
            const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
            const path = `${taskId}/${randomId}.${ext}`

            console.log('[Upload] Starting upload for:', file.name)

            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(path, file)

            if (uploadError) {
                console.error('[Upload error]', uploadError)
                setUploading(false)
                return
            }

            console.log('[Upload] Storage success, inserting DB record...')

            const { data, error } = await supabase
                .from('task_attachments')
                .insert({
                    task_id: taskId,
                    filename: file.name,
                    storage_path: path,
                    mime_type: file.type || 'application/octet-stream',
                    size_bytes: file.size,
                })
                .select('*')
                .single()

            if (error) {
                console.error('[Insert Error]', error)
                // Attempt cleanup
                await supabase.storage.from('task-attachments').remove([path])
            } else if (data) {
                console.log('[Upload] Success:', data)
                setAttachments(prev => [data as TaskAttachment, ...prev])
            }
        } catch (err) {
            console.error('[Upload exception]', err)
        }
        setUploading(false)
    }

    const deleteAttachment = async (att: TaskAttachment) => {
        await supabase.storage.from('task-attachments').remove([att.storage_path])
        await supabase.from('task_attachments').delete().eq('id', att.id)
        setAttachments(prev => prev.filter(a => a.id !== att.id))
    }

    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from('task-attachments').getPublicUrl(path)
        return data.publicUrl
    }

    return { attachments, loading, uploading, uploadAttachment, deleteAttachment, getPublicUrl, refetch: fetchAttachments }
}
