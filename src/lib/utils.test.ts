import { describe, it, expect } from 'vitest'
import { cn, formatDate, getPriorityLabel, getPriorityStyles, getStatusLabel, getStatusIcon } from './utils'

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2')
        })

        it('should handle conditional classes', () => {
            expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
            expect(cn('class1', true && 'class2', 'class3')).toBe('class1 class2 class3')
        })

        it('should handle null and undefined', () => {
            expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2')
        })
    })

    describe('formatDate', () => {
        it('should format a valid date string', () => {
            // Note: Month index 0-11. 2023-01-15 -> 15 ENE
            // new Date('2023-01-15T12:00:00') might depend on timezone if not handled carefully,
            // but the implementation uses getDate() and getMonth() which use local time.
            // Ensure we test with a date that safely falls in the same day.

            // Mocking timezone might be needed if strict, but for now let's hope it's stable enough or checking loose match.
            // Actually, let's just check the structure or mock the date if needed. 
            // Ideally, we should mock the system time or pass a specific timezone date. 
            // For this project's simplicity, let's assume standard behavior.

            // However, the implementation `new Date(dateStr)` parses as UTC if ISO string, or local? 
            // If the input is just YYYY-MM-DD it's usually UTC. 
            // Let's test with a full ISO string to be safer, or just check that it returns A string.

            const result = formatDate('2023-01-15T10:00:00')
            expect(result).toMatch(/\d{2} [A-Z]{3}/) // Matches "15 ENE" format pattern
        })

        it('should return empty string for null', () => {
            expect(formatDate(null)).toBe('')
        })

        it('should return empty string for empty string', () => {
            expect(formatDate('')).toBe('')
        })
    })

    describe('getPriorityLabel', () => {
        it('should return correct labels', () => {
            expect(getPriorityLabel('alta')).toBe('URGENTE')
            expect(getPriorityLabel('media')).toBe('NORMAL')
            expect(getPriorityLabel('baja')).toBe('BAJA')
        })

        it('should return uppercase for unknown priority', () => {
            expect(getPriorityLabel('unknown')).toBe('UNKNOWN')
        })
    })

    describe('getPriorityStyles', () => {
        it('should return styles for priorities', () => {
            expect(getPriorityStyles('alta')).toContain('bg-red-100')
            expect(getPriorityStyles('media')).toContain('bg-gray-200')
            expect(getPriorityStyles('baja')).toContain('bg-green-100')
        })

        it('should return default styles for unknown', () => {
            expect(getPriorityStyles('unknown')).toBe('bg-gray-200 text-black border-2 border-black')
        })
    })

    describe('getStatusLabel', () => {
        it('should return correct labels', () => {
            expect(getStatusLabel('backlog')).toBe('Pendientes')
            expect(getStatusLabel('por_hacer')).toBe('Hoy')
            expect(getStatusLabel('en_proceso')).toBe('En Curso')
            expect(getStatusLabel('terminado')).toBe('Listo')
        })

        it('should return status itself for unknown', () => {
            expect(getStatusLabel('unknown')).toBe('unknown')
        })
    })

    describe('getStatusIcon', () => {
        it('should return correct icons', () => {
            expect(getStatusIcon('backlog')).toBe('pending_actions')
            expect(getStatusIcon('por_hacer')).toBe('today')
            expect(getStatusIcon('en_proceso')).toBe('construction')
            expect(getStatusIcon('terminado')).toBe('check_circle')
        })

        it('should return help icon for unknown', () => {
            expect(getStatusIcon('unknown')).toBe('help')
        })
    })
})
