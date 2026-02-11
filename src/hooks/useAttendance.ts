import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AttendanceLog } from '../types/database'

export function useAttendance() {
    const [logs, setLogs] = useState<AttendanceLog[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch logs for a specific date (defaults to today)
    const fetchDailyLogs = useCallback(async (date: string = new Date().toISOString().split('T')[0]) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    employee:employees (id, first_name, last_name, role)
                `)
                .eq('date', date)
                .order('check_in', { ascending: false })

            if (error) throw error
            setLogs(data as any || [])
        } catch (error) {
            console.error('Error fetching attendance logs:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const checkIn = async (employeeId: string) => {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()

        // Determine status based on time (e.g., late if after 9:00 AM)
        const limitTime = new Date()
        limitTime.setHours(9, 0, 0, 0)
        const status = now > limitTime ? 'tarde' : 'presente'

        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .insert({
                    employee_id: employeeId,
                    date: today,
                    check_in: now.toISOString(),
                    status: status
                })
                .select()
                .single()

            if (error) throw error
            await fetchDailyLogs(today)
            return data
        } catch (error) {
            console.error('Error checking in:', error)
            throw error
        }
    }

    const checkOut = async (logId: string) => {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .update({ check_out: new Date().toISOString() })
                .eq('id', logId)
                .select()
                .single()

            if (error) throw error
            await fetchDailyLogs() // Refresh
            return data
        } catch (error) {
            console.error('Error checking out:', error)
            throw error
        }
    }

    const getEmployeeStats = async (employeeId: string) => {
        try {
            // Get last 30 days logs
            const { data, error } = await supabase
                .from('attendance_logs')
                .select('status')
                .eq('employee_id', employeeId)
                .limit(30)

            if (error) throw error

            const total = data.length
            const present = data.filter(l => l.status === 'presente').length
            const late = data.filter(l => l.status === 'tarde').length

            return {
                totalDays: total,
                presentCount: present,
                lateCount: late,
                punctuality: total > 0 ? Math.round((present / total) * 100) : 0
            }
        } catch (error) {
            console.error('Error getting stats:', error)
            return null
        }
    }

    return {
        logs,
        loading,
        fetchDailyLogs,
        checkIn,
        checkOut,
        getEmployeeStats
    }
}
