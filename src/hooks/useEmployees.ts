import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Employee } from '../types/database'

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('first_name', { ascending: true })

            if (error) {
                console.error('Error fetching employees:', error)
                return
            }

            setEmployees((data as Employee[]) || [])
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>) => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .insert(employee)
                .select()
                .single()

            if (error) throw error
            setEmployees(prev => [...prev, data as Employee])
            return data
        } catch (error) {
            console.error('Error creating employee:', error)
            throw error
        }
    }

    const updateEmployee = async (id: string, updates: Partial<Employee>) => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            setEmployees(prev => prev.map(e => e.id === id ? (data as Employee) : e))
            return data
        } catch (error) {
            console.error('Error updating employee:', error)
            throw error
        }
    }

    const deleteEmployee = async (id: string) => {
        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id)

            if (error) throw error
            setEmployees(prev => prev.filter(e => e.id !== id))
        } catch (error) {
            console.error('Error deleting employee:', error)
            throw error
        }
    }

    return {
        employees,
        loading,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        refetch: fetchEmployees
    }
}
