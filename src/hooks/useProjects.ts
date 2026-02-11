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
            setProjects((data as Project[]) || [])
        }
        setLoading(false)
    }, [filter])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const createProject = async (project: { name: string; client: string; employeeIds?: string[] }) => {
        const { data, error } = await supabase
            .from('projects')
            .insert({ name: project.name, client: project.client })
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
            return null
        }

        if (project.employeeIds && project.employeeIds.length > 0) {
            const employeeInserts = project.employeeIds.map(empId => ({
                project_id: (data as Project).id,
                employee_id: empId
            }))
            const { error: empError } = await supabase
                .from('project_employees')
                .insert(employeeInserts)

            if (empError) {
                console.error('Error assigning employees:', empError)
            }
        }

        await fetchProjects()
        return data
    }

    const updateProject = async (id: string, updates: { name?: string; client?: string; status?: ProjectStatus }, employeeIds?: string[]) => {
        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating project:', error)
            return false
        }

        if (employeeIds !== undefined) {
            // First delete all existing associations
            const { error: deleteError } = await supabase
                .from('project_employees')
                .delete()
                .eq('project_id', id)

            if (deleteError) {
                console.error('Error removing old assignments:', deleteError)
            } else if (employeeIds.length > 0) {
                // Then insert new ones
                const employeeInserts = employeeIds.map(empId => ({
                    project_id: id,
                    employee_id: empId
                }))
                const { error: insertError } = await supabase
                    .from('project_employees')
                    .insert(employeeInserts)

                if (insertError) {
                    console.error('Error assigning new employees:', insertError)
                }
            }
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
            setProjects((data as Project[]) || [])
        }
        setLoading(false)
    }

    const allProjects = useCallback(async () => {
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'activo')
            .order('name')
        return (data as Project[]) || []
    }, [])

    const getProjectEmployees = useCallback(async (projectId: string) => {
        const { data, error } = await supabase
            .from('project_employees')
            .select('employee_id')
            .eq('project_id', projectId)

        if (error) {
            console.error('Error fetching project employees:', error)
            return []
        }
        return data.map((d: any) => d.employee_id) as string[]
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
        getProjectEmployees,
    }
}
