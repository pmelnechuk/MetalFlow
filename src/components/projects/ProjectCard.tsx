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
            className={`card-hover group relative border-[3px] border-black rounded-xl p-5 cursor-pointer transition-all ${isPaused
                    ? 'bg-gray-50 opacity-70 border-gray-400'
                    : 'bg-white card-shadow'
                }`}
        >
            <div className="flex flex-col gap-2.5">
                {/* Header: Client + Badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-green-500'} shrink-0 mt-0.5`} />
                        <p className="text-base font-extrabold text-hc-accent uppercase tracking-wider">
                            {project.client}
                        </p>
                    </div>
                    {highPriority && (
                        <div className="bg-hc-highlight text-black border-2 border-black px-2.5 py-0.5 font-extrabold text-xs uppercase rounded shadow-[2px_2px_0px_0px_#000000] badge-pulse shrink-0">
                            URGENTE
                        </div>
                    )}
                    {isPaused && (
                        <div className="bg-gray-100 text-gray-600 px-2.5 py-0.5 font-extrabold text-xs uppercase border-2 border-gray-400 rounded shrink-0">
                            PAUSADO
                        </div>
                    )}
                </div>

                {/* Project name */}
                <h3 className="text-2xl sm:text-[1.65rem] font-black text-black leading-tight">
                    {project.name}
                </h3>

                {/* Footer: date + task count */}
                <div className="flex items-center gap-3 mt-1">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${isPaused
                            ? 'border-2 border-red-600/50 text-red-700 bg-red-50'
                            : 'border-2 border-black bg-hc-surface'
                        }`}>
                        <span className={`material-symbols-outlined text-lg ${isPaused ? '' : 'text-hc-accent'}`}>
                            {isPaused ? 'pause_circle' : 'calendar_today'}
                        </span>
                        <span className="font-extrabold">
                            {isPaused ? 'EN ESPERA' : formatDate(project.created_at)}
                        </span>
                    </div>
                    {taskCount !== undefined && taskCount > 0 && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <span className="material-symbols-outlined text-lg">task</span>
                            <span className="text-sm font-extrabold">{taskCount}</span>
                        </div>
                    )}
                    {/* Chevron */}
                    <span className="material-symbols-outlined text-xl text-gray-300 ml-auto group-hover:text-hc-accent group-hover:translate-x-1 transition-all">
                        chevron_right
                    </span>
                </div>
            </div>
        </div>
    )
}
