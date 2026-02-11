import { formatDate } from '../../lib/utils'
import type { Project } from '../../types/database'

interface ProjectCardProps {
    project: Project
    taskCount?: number
    highPriority?: boolean
    onPress?: () => void
}

export function ProjectCard({ project, taskCount, highPriority, onPress }: ProjectCardProps) {
    const isPaused = project.status === 'inactivo'

    return (
        <div
            onClick={onPress}
            className={`group bg-white rounded-xl border border-gray-200 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ${isPaused ? 'opacity-70 bg-gray-50' : 'hover:border-navy-200'
                }`}
        >
            {/* Status Accent Line */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${isPaused ? 'bg-gray-300' : 'bg-navy-600 group-hover:bg-royal-blue transition-colors'}`} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {project.client}
                    </span>
                    {highPriority && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
                            Urgente
                        </span>
                    )}
                </div>

                <h3 className={`text-lg font-bold text-navy-900 mb-3 leading-snug ${isPaused ? 'text-gray-600' : 'group-hover:text-royal-blue transition-colors'}`}>
                    {project.name}
                </h3>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            <span>{formatDate(project.created_at)}</span>
                        </div>
                        {taskCount !== undefined && taskCount > 0 && (
                            <div className="flex items-center gap-1 text-navy-600 font-bold">
                                <span className="material-symbols-outlined text-base">task</span>
                                <span>{taskCount}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {isPaused ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Pausado
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase border border-green-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Activo
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
