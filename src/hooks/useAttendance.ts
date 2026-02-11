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

        // Determine status based on time
        // Morning limit: 6:40 AM
        // Afternoon limit: 13:10 PM
        const limitMorning = new Date()
        limitMorning.setHours(6, 40, 0, 0)

        const limitAfternoon = new Date()
        limitAfternoon.setHours(13, 10, 0, 0)

        let status = 'presente'

        // Logic: If check-in is before 12 PM, treat as morning shift. Else, afternoon.
        if (now.getHours() < 12) {
            if (now > limitMorning) status = 'tarde'
        } else {
            if (now > limitAfternoon) status = 'tarde'
        }

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

    const updateLog = async (logId: string, updates: { check_in?: string; check_out?: string }) => {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .update(updates)
                .eq('id', logId)
                .select()
                .single()

            if (error) throw error
            await fetchDailyLogs()
            return data
        } catch (error) {
            console.error('Error updating log:', error)
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
            const absent = data.filter(l => l.status === 'ausente').length

            return {
                totalDays: total,
                presentCount: present,
                lateCount: late,
                absentCount: absent,
                // Punctuality: On Time / (On Time + Late)
                punctuality: (present + late) > 0 ? Math.round((present / (present + late)) * 100) : 0,
                // Attendance Rate: (Present + Late) / Total (including absent)
                attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
            }
        } catch (error) {
            console.error('Error getting stats:', error)
            return null
        }
    }

    const getWeeklyLogs = async (startDate: string, endDate: string) => {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    employee:employees (id, first_name, last_name, role)
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })
                .order('check_in', { ascending: true })

            if (error) throw error
            return data as any[]
        } catch (error) {
            console.error('Error fetching weekly logs:', error)
            return []
        }
    }

    return {
        logs,
        loading,
        fetchDailyLogs,
        checkIn,
        checkOut,
        updateLog,
        getEmployeeStats,
        getWeeklyLogs
    }
}
