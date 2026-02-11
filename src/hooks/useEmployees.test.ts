import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmployees } from './useEmployees'

// Hoist mocks to be available in vi.mock
const mocks = vi.hoisted(() => {
    return {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        single: vi.fn(),
        from: vi.fn(),
    }
})

vi.mock('../lib/supabase', () => ({
    supabase: {
        from: mocks.from
    }
}))

describe('useEmployees', () => {
    let builder: any;

    beforeEach(() => {
        vi.clearAllMocks()

        // Create a chainable builder that is also thenable
        builder = {
            select: mocks.select,
            insert: mocks.insert,
            update: mocks.update,
            delete: mocks.delete,
            eq: mocks.eq,
            order: mocks.order,
            single: mocks.single,
            then: (resolve: any) => resolve({ data: null, error: null })
        }

        mocks.from.mockReturnValue(builder)
        mocks.select.mockReturnValue(builder)
        mocks.insert.mockReturnValue(builder)
        mocks.update.mockReturnValue(builder)
        mocks.delete.mockReturnValue(builder)
        mocks.eq.mockReturnValue(builder)

        mocks.single.mockResolvedValue({ data: null, error: null })
        mocks.order.mockResolvedValue({ data: [], error: null })
    })

    it('should fetch employees on mount', async () => {
        const mockData = [{ id: '1', first_name: 'John', last_name: 'Doe' }]
        mocks.order.mockResolvedValue({ data: mockData, error: null })

        const { result } = renderHook(() => useEmployees())

        expect(result.current.loading).toBe(true)

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        expect(result.current.employees).toEqual(mockData)
        expect(mocks.from).toHaveBeenCalledWith('employees')
        expect(mocks.select).toHaveBeenCalledWith('*')
    })

    it('should create an employee', async () => {
        const newEmployee = { first_name: 'Jane', last_name: 'Doe', role: 'Dev', status: 'active' }
        const createdEmployee = { id: '2', ...newEmployee }

        mocks.single.mockResolvedValue({ data: createdEmployee, error: null })

        const { result } = renderHook(() => useEmployees())
        await waitFor(() => expect(result.current.loading).toBe(false))

        await act(async () => {
            await result.current.createEmployee(newEmployee)
        })

        expect(mocks.insert).toHaveBeenCalledWith(newEmployee)
        expect(result.current.employees).toContainEqual(createdEmployee)
    })

    it('should update an employee', async () => {
        const initialData = [{ id: '1', first_name: 'John', last_name: 'Doe' }]
        mocks.order.mockResolvedValue({ data: initialData, error: null })

        const { result } = renderHook(() => useEmployees())
        await waitFor(() => expect(result.current.loading).toBe(false))

        const updates = { first_name: 'Johnny' }
        const updatedEmployee = { ...initialData[0], ...updates }

        mocks.single.mockResolvedValue({ data: updatedEmployee, error: null })

        await act(async () => {
            await result.current.updateEmployee('1', updates)
        })

        expect(mocks.update).toHaveBeenCalledWith(updates)
        expect(mocks.eq).toHaveBeenCalledWith('id', '1')
        expect(result.current.employees[0].first_name).toBe('Johnny')
    })

    it('should delete an employee', async () => {
        const initialData = [{ id: '1', first_name: 'John', last_name: 'Doe' }]
        mocks.order.mockResolvedValue({ data: initialData, error: null })

        const { result } = renderHook(() => useEmployees())
        await waitFor(() => expect(result.current.loading).toBe(false))

        await act(async () => {
            await result.current.deleteEmployee('1')
        })

        expect(mocks.delete).toHaveBeenCalled()
        expect(mocks.eq).toHaveBeenCalledWith('id', '1')
        expect(result.current.employees).toHaveLength(0)
    })
})
