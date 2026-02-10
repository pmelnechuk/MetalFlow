import type { Task, TaskStatus } from '../../types/database'
import { getStatusLabel, getStatusIcon } from '../../lib/utils'
import { TaskCard } from './TaskCard'
import { useDroppable } from '@dnd-kit/core'

interface KanbanSectionProps {
    status: TaskStatus
    tasks: Task[]
    defaultOpen?: boolean
    onMenuClick?: (task: Task) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
    backlog: 'text-gray-500',
    por_hacer: 'text-amber-600',
    en_proceso: 'text-hc-accent',
    terminado: 'text-green-600',
}

const STATUS_BG: Record<TaskStatus, string> = {
    backlog: 'bg-gray-50',
    por_hacer: 'bg-amber-50',
    en_proceso: 'bg-blue-50',
    terminado: 'bg-green-50',
}

export function KanbanSection({ status, tasks, defaultOpen = true, onMenuClick }: KanbanSectionProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    })

    return (
        <details className="group" open={defaultOpen}>
            <summary className="flex items-center justify-between cursor-pointer py-3 px-3 border-[3px] border-black rounded-xl bg-white card-shadow-sm hover:card-shadow transition-all sticky top-0 z-10 select-none">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg ${STATUS_BG[status]} border-2 border-black flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-xl icon-filled ${STATUS_COLORS[status]}`}>
                            {getStatusIcon(status)}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-black uppercase tracking-wide leading-none">
                            {getStatusLabel(status)}
                        </h2>
                    </div>
                    <span className={`text-sm font-extrabold ml-1 px-2 py-0.5 rounded-full border-2 border-black counter-badge ${tasks.length > 0 ? `${STATUS_BG[status]} ${STATUS_COLORS[status]}` : 'bg-gray-100 text-gray-400'
                        }`}>
                        {tasks.length}
                    </span>
                </div>
                <span className="material-symbols-outlined text-2xl text-gray-400 expand-icon transition-transform duration-300 group-hover:text-black">
                    expand_more
                </span>
            </summary>
            <div
                ref={setNodeRef}
                className={`pt-4 pb-2 space-y-3 min-h-[48px] transition-all duration-200 rounded-lg ${isOver ? 'bg-hc-accent-light/40 ring-2 ring-hc-accent ring-dashed p-3' : ''
                    }`}
            >
                {tasks.length === 0 ? (
                    <div className={`text-center py-6 border-2 border-dashed rounded-xl transition-colors ${isOver ? 'border-hc-accent bg-hc-accent-light/30' : 'border-gray-200'
                        }`}>
                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-1">inbox</span>
                        <p className="text-sm font-bold text-gray-400 uppercase">Arrastrá tareas aquí</p>
                    </div>
                ) : (
                    tasks.map((task, i) => (
                        <div
                            key={task.id}
                            className="stagger-item"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <TaskCard task={task} onMenuClick={onMenuClick} />
                        </div>
                    ))
                )}
            </div>
        </details>
    )
}
