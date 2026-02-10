import { formatDate } from '../../lib/utils'
import type { Task } from '../../types/database'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '../../lib/utils'

interface TaskCardProps {
    task: Task
    onMenuClick?: (task: Task) => void
    onTaskClick?: (task: Task) => void
}

export function TaskCard({ task, onMenuClick, onTaskClick }: TaskCardProps) {
    const priority = task.priority || 'media'
    const progress = task.progress || 0
    const isCompleted = task.status === 'terminado'
    const isUrgent = priority === 'alta'

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })

    const style = transform ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
    } : undefined

    // Priority Styles
    const getPriorityClasses = (p: string) => {
        switch (p) {
            case 'alta': // Urgente in UI
                return 'border-l-4 border-l-red-600'
            case 'media': // Alta in UI
                return 'border-l-4 border-l-royal-blue'
            default: // Baja / Normal
                return 'border-l-0' // No L-border for normal
        }
    }

    const getTagClasses = (p: string) => {
        switch (p) {
            case 'alta':
                return 'bg-red-50 text-red-700 border border-red-100'
            case 'media':
                return 'bg-blue-50 text-royal-blue border border-blue-100'
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-300'
        }
    }

    const getLabel = (p: string) => {
        switch (p) {
            case 'alta': return 'Urgente'
            case 'media': return 'Alta Prioridad'
            default: return 'Normal'
        }
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style as any}
            onClick={() => onTaskClick?.(task)}
            className={cn(
                "group bg-white border border-slate-200 rounded-sm p-4 shadow-formal transition-all cursor-grab active:cursor-grabbing hover:border-navy-700 relative",
                getPriorityClasses(priority),
                isDragging && "shadow-floating scale-[1.02] opacity-90 rotate-1 z-50",
                isCompleted && "opacity-70 bg-slate-50"
            )}
        >
            {/* Header: Tag + Menu */}
            <div className="flex justify-between items-start mb-2">
                <span className={cn(
                    "px-2 py-0.5 font-bold text-xs uppercase rounded-sm flex items-center gap-1",
                    getTagClasses(priority)
                )}>
                    {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                    {isCompleted ? 'Completado' : getLabel(priority)}
                </span>

                <button
                    onClick={(e) => { e.stopPropagation(); onMenuClick?.(task) }}
                    className="text-slate-400 hover:text-navy-900 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <span className="material-symbols-outlined text-xl">more_horiz</span>
                </button>
            </div>

            {/* Content */}
            <h3 className={cn(
                "text-lg font-bold text-slate-900 leading-tight mb-1",
                isCompleted && "line-through text-slate-500"
            )}>
                {task.title}
            </h3>
            <p className={cn(
                "text-base text-slate-600 mb-3 font-medium line-clamp-2",
                isCompleted && "line-through text-slate-400"
            )}>
                {task.description || (task.project?.client ? `Cliente: ${task.project.client}` : 'Sin descripción')}
            </p>

            {/* Progress Bar (if in progress) */}
            {task.status === 'en_proceso' && !isCompleted && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-royal-blue h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-royal-blue whitespace-nowrap">{progress}%</span>
                </div>
            )}

            {/* Footer: Date / Users */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-auto">
                {task.due_date && (
                    <div className={cn(
                        "flex items-center gap-2 text-sm font-semibold",
                        isUrgent ? "text-red-700" : "text-navy-700"
                    )}>
                        <span className="material-symbols-outlined text-lg">event</span>
                        <span>{formatDate(task.due_date).toUpperCase()}</span>
                    </div>
                )}

                {/* Users Avatars (Placeholder or initials) */}
                {task.assigned_to && task.assigned_to.length > 0 && (
                    <div className="flex -space-x-2">
                        {task.assigned_to.slice(0, 3).map((u, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-navy-100 border border-white flex items-center justify-center text-[10px] font-bold text-navy-800 uppercase" title={u}>
                                {u.substring(0, 2)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
