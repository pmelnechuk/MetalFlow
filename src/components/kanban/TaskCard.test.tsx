import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from './TaskCard'
import type { Task } from '../../types/database'

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: false,
    })
}))

const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    status: 'por_hacer',
    priority: 'alta',
    project_id: 'p1',
    description: 'Test Description',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    assigned_to: ['John Doe', 'Jane Smith'],
    due_date: null,
    position: 0,
    progress: 0,
    status_changed_at: null,
    project: {
        id: 'p1',
        name: 'Project 1',
        client: 'Client 1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        status: 'activo'
    }
}

describe('TaskCard', () => {
    it('should render task title', () => {
        render(<TaskCard task={mockTask} />)
        expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should render assigned employees', () => {
        render(<TaskCard task={mockTask} />)
        // TaskCard currently matches substring(0,2) -> 'Jo', 'Ja'
        expect(screen.getByText('Jo')).toBeInTheDocument()
        expect(screen.getByText('Ja')).toBeInTheDocument()
    })

    it('should show urgent label for alta priority', () => {
        render(<TaskCard task={mockTask} />)
        expect(screen.getByText('Urgente')).toBeInTheDocument()
    })

    it('should call onTaskClick when clicked', () => {
        const onTaskClick = vi.fn()
        render(<TaskCard task={mockTask} onTaskClick={onTaskClick} />)

        fireEvent.click(screen.getByText('Test Task'))
        expect(onTaskClick).toHaveBeenCalledWith(mockTask)
    })
})
