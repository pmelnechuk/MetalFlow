import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeTasks(onUpdate: () => void) {
    useEffect(() => {
        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    onUpdate()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => {
                    onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [onUpdate])
}
