import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Project, ProjectStatus } from '../types/database'

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'activo' | 'inactivo'>('activo')

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status', filter)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects:', error)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }, [filter])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const createProject = async (project: { name: string; client: string }) => {
        const { data, error } = await supabase
            .from('projects')
            .insert({ name: project.name, client: project.client })
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
            return null
        }
        await fetchProjects()
        return data
    }

    const updateProject = async (id: string, updates: { name?: string; client?: string; status?: ProjectStatus }) => {
        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating project:', error)
            return false
        }
        await fetchProjects()
        return true
    }

    const deleteProject = async (id: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting project:', error)
            return false
        }
        await fetchProjects()
        return true
    }

    const searchProjects = async (query: string) => {
        if (!query.trim()) {
            return fetchProjects()
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status', filter)
            .or(`name.ilike.%${query}%,client.ilike.%${query}%`)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error searching projects:', error)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }

    const allProjects = useCallback(async () => {
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'activo')
            .order('name')
        return data || []
    }, [])

    return {
        projects,
        loading,
        filter,
        setFilter,
        createProject,
        updateProject,
        deleteProject,
        searchProjects,
        refetch: fetchProjects,
        allProjects,
    }
}
