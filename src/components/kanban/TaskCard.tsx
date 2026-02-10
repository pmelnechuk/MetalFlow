import { formatDate, getPriorityLabel, getPriorityStyles } from '../../lib/utils'
import type { Task } from '../../types/database'
import { useDraggable } from '@dnd-kit/core'

interface TaskCardProps {
    task: Task
    onMenuClick?: (task: Task) => void
}

export function TaskCard({ task, onMenuClick }: TaskCardProps) {
    const isCompleted = task.status === 'terminado'
    const isUrgent = task.priority === 'alta'
    const isInProgress = task.status === 'en_proceso'

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })

    const style = transform ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style as any}
            className={`group border-[2px] border-black rounded-xl p-3.5 relative transition-all cursor-grab active:cursor-grabbing ${isDragging
                    ? 'shadow-[6px_6px_0px_0px_#000000] scale-[1.02] opacity-90 rotate-1'
                    : isCompleted
                        ? 'bg-gray-50 opacity-70 border-gray-300'
                        : isUrgent
                            ? 'bg-red-50/50 card-shadow-sm hover:shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5'
                            : isInProgress
                                ? 'bg-white card-shadow-sm border-hc-accent hover:shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5'
                                : 'bg-white card-shadow-sm hover:shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5'
                }`}
        >
            {/* Priority indicator */}
            {!isCompleted && (
                <div className={`absolute top-0 left-3 right-3 h-[2px] rounded-b-full ${isUrgent ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-400' : 'bg-green-400'
                    }`} />
            )}

            <div className="flex justify-between items-start mb-1.5">
                <span className={`px-2 py-0.5 font-extrabold text-[10px] uppercase rounded ${getPriorityStyles(task.priority)} ${isCompleted ? 'opacity-50' : ''}`}>
                    {isCompleted ? '✓ LISTO' : getPriorityLabel(task.priority)}
                </span>
                {!isCompleted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMenuClick?.(task) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-hc-surface transition-all"
                    >
                        <span className="material-symbols-outlined text-base text-gray-400">more_vert</span>
                    </button>
                )}
                {isCompleted && (
                    <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center border border-green-500">
                        <span className="material-symbols-outlined text-sm text-green-700 icon-filled">check</span>
                    </div>
                )}
            </div>

            <h3 className={`text-sm font-black text-black leading-tight mb-0.5 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.project?.client || 'Sin cliente'}
            </h3>
            <p className={`text-xs font-semibold mb-2 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                {task.title}
            </p>

            {/* Progress */}
            {isInProgress && (
                <div className="mb-1.5">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-hc-accent h-full rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
                    </div>
                    <p className="text-right text-[10px] font-extrabold text-hc-accent mt-0.5">{task.progress}%</p>
                </div>
            )}

            {/* Date */}
            {!isCompleted && task.due_date && (
                <div className="flex items-center gap-1 text-gray-400">
                    <span className="material-symbols-outlined text-xs">event</span>
                    <span className="text-[11px] font-bold">{formatDate(task.due_date)}</span>
                </div>
            )}
        </div>
    )
}
