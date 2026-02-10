import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TaskComment {
    id: string
    task_id: string
    content: string
    author: string
    created_at: string
}

export function useTaskComments(taskId: string | null) {
    const [comments, setComments] = useState<TaskComment[]>([])
    const [loading, setLoading] = useState(false)

    const fetchComments = useCallback(async () => {
        if (!taskId) return
        setLoading(true)
        const { data } = await (supabase
            .from('task_comments') as any)
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true })
        setComments((data as TaskComment[]) || [])
        setLoading(false)
    }, [taskId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const addComment = async (content: string, author = 'Admin') => {
        if (!taskId || !content.trim()) return
        const { data, error } = await (supabase
            .from('task_comments') as any)
            .insert({ task_id: taskId, content, author })
            .select('*')
            .single()
        if (!error && data) {
            setComments(prev => [...prev, data as TaskComment])
        }
    }

    const deleteComment = async (commentId: string) => {
        await (supabase.from('task_comments') as any).delete().eq('id', commentId)
        setComments(prev => prev.filter(c => c.id !== commentId))
    }

    return { comments, loading, addComment, deleteComment, refetch: fetchComments }
}
