import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Entity } from '../types/database'

export function useEntities() {
    const [entities, setEntities] = useState<Entity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('entities')
            .select('*')
            .order('name')
            .then(({ data, error }) => {
                if (!error) setEntities((data as Entity[]) || [])
                setLoading(false)
            })
    }, [])

    return { entities, loading }
}
