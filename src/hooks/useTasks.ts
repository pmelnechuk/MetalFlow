import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskPriority } from '../types/database'

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('tasks')
            .select('*, project:projects(*)')
            .order('position', { ascending: true })

        if (error) {
            console.error('Error fetching tasks:', error)
        } else {
            setTasks((data as unknown as Task[]) || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const createTask = async (task: {
        title: string
        description?: string
        project_id?: string
        priority?: TaskPriority
        status?: TaskStatus
        due_date?: string
    }) => {
        const targetStatus = task.status || 'backlog'
        const maxPos = tasks
            .filter(t => t.status === targetStatus)
            .reduce((max, t) => Math.max(max, t.position || 0), -1)

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: task.title,
                description: task.description || null,
                project_id: task.project_id || null,
                priority: task.priority || 'media',
                status: targetStatus,
                position: maxPos + 1,
                due_date: task.due_date || null,
                progress: 0,
            })
            .select('*, project:projects(*)')
            .single()

        if (error) {
            console.error('Error creating task:', error)
            return null
        }
        await fetchTasks()
        return data
    }

    const updateTask = async (id: string, updates: {
        title?: string
        description?: string | null
        project_id?: string | null
        priority?: TaskPriority
        status?: TaskStatus
        position?: number
        due_date?: string | null
        progress?: number
    }) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating task:', error)
            return false
        }
        await fetchTasks()
        return true
    }

    const moveTask = async (taskId: string, newStatus: TaskStatus) => {
        const maxPos = tasks
            .filter(t => t.status === newStatus)
            .reduce((max, t) => Math.max(max, t.position || 0), -1)

        return updateTask(taskId, { status: newStatus, position: maxPos + 1 })
    }

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting task:', error)
            return false
        }
        await fetchTasks()
        return true
    }

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter(t => t.status === status).sort((a, b) => (a.position || 0) - (b.position || 0))
    }

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        getTasksByStatus,
        refetch: fetchTasks,
    }
}
