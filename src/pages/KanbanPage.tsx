import { useState, useCallback } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { useTasks } from '../hooks/useTasks'
import { useRealtimeTasks } from '../hooks/useRealtimeTasks'
import { TaskCard } from '../components/kanban/TaskCard'
import { TaskDetailModal } from '../components/kanban/TaskDetailModal'
import { TopBar } from '../components/layout/TopBar'
import type { Task, TaskStatus, TaskPriority } from '../types/database'
import { useProjects } from '../hooks/useProjects'
import { useDroppable } from '@dnd-kit/core'
import { useEmployees } from '../hooks/useEmployees'
import { getStatusLabel, getStatusIcon, cn } from '../lib/utils'
import { VoiceRecorderButton } from '../components/ui/VoiceRecorderButton'
import type { AITaskExtraction } from '../lib/gemini'

const STATUSES: TaskStatus[] = ['backlog', 'por_hacer', 'en_proceso', 'terminado']

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; iconBg: string; border: string }> = {
    backlog: { bg: 'bg-slate-50', text: 'text-slate-600', iconBg: 'bg-white', border: 'border-slate-200' },
    por_hacer: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-white', border: 'border-amber-200' },
    en_proceso: { bg: 'bg-blue-50', text: 'text-royal-blue', iconBg: 'bg-white', border: 'border-blue-200' },
    terminado: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-white', border: 'border-green-200' },
}

function KanbanColumn({ status, tasks, onMenuClick, onTaskClick }: { status: TaskStatus; tasks: Task[]; onMenuClick: (t: Task) => void; onTaskClick: (t: Task) => void }) {
    const { setNodeRef, isOver } = useDroppable({ id: status })
    const colors = STATUS_COLORS[status]

    return (
        <div className="flex flex-col min-w-[300px] lg:min-w-[320px] max-w-[360px] w-full shrink-0 h-full">
            {/* Column header */}
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-t-xl border-b-[3px] ${colors.border} ${colors.bg} mb-0 sticky top-0 z-10 shadow-sm transition-colors hover:shadow-md`}>
                <div className={`w-6 h-6 rounded-md ${colors.iconBg} flex items-center justify-center shadow-sm`}>
                    <span className={`material-symbols-outlined text-base icon-filled ${colors.text}`}>
                        {getStatusIcon(status)}
                    </span>
                </div>
                <h2 className={`text-xs font-bold uppercase tracking-wider flex-1 ${colors.text}`}>
                    {getStatusLabel(status)}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white shadow-sm ${colors.text}`}>
                    {tasks.length}
                </span>
            </div>

            {/* Cards area */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 space-y-3 p-3 bg-gray-50/80 rounded-b-xl border-x border-b border-gray-200 min-h-[150px] transition-colors overflow-y-auto custom-scrollbar',
                    isOver ? 'bg-blue-50/80 ring-2 ring-royal-blue ring-inset' : ''
                )}
            >
                {tasks.length === 0 ? (
                    <div className={cn(
                        'text-center py-12 border-2 border-dashed rounded-xl transition-all',
                        isOver ? 'border-royal-blue bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                    )}>
                        <span className="material-symbols-outlined text-2xl text-slate-300 mb-2">inbox</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vacío</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onMenuClick={onMenuClick} onTaskClick={onTaskClick} />
                    ))
                )}
            </div>
        </div>
    )
}

export function KanbanPage() {
    const { tasks, loading, getTasksByStatus, moveTask, createTask, updateTask, deleteTask, refetch } = useTasks()
    const { allProjects } = useProjects()
    const { employees } = useEmployees()
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [menuTask, setMenuTask] = useState<Task | null>(null)
    const [detailTask, setDetailTask] = useState<Task | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskDescription, setNewTaskDescription] = useState('')
    const [newTaskProjectId, setNewTaskProjectId] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('media')
    const [newTaskDueDate, setNewTaskDueDate] = useState('')
    const [newTaskEmployees, setNewTaskEmployees] = useState<string[]>([])
    const [projectsList, setProjectsList] = useState<{ id: string; name: string; client: string }[]>([])

    useRealtimeTasks(useCallback(() => { refetch() }, [refetch]))

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const handleDragStart = (event: any) => {
        const task = tasks.find(t => t.id === event.active.id)
        if (task) setActiveTask(task)
    }

    const handleDragEnd = async (event: any) => {
        setActiveTask(null)
        const { active, over } = event
        if (!over) return
        const taskId = active.id as string
        const newStatus = over.id as TaskStatus
        const task = tasks.find(t => t.id === taskId)
        if (task && task.status !== newStatus) {
            await moveTask(taskId, newStatus)
        }
    }

    const handleOpenCreate = async () => {
        const projects = await allProjects()
        setProjectsList(projects)
        setShowCreateForm(true)
    }

    const handleVoiceProcessed = (data: AITaskExtraction) => {
        if (data.task) setNewTaskTitle(data.task)
        if (data.description) setNewTaskDescription(data.description)
        if (data.project) {
            // Simple match by name or client
            const proj = projectsList.find(p =>
                p.name.toLowerCase().includes(data.project.toLowerCase()) ||
                p.client.toLowerCase().includes(data.project.toLowerCase())
            )
            if (proj) setNewTaskProjectId(proj.id)
        }
        if (data.priority) setNewTaskPriority(data.priority)
        if (data.due_date) setNewTaskDueDate(data.due_date)
        if (data.assigned_to && data.assigned_to.length > 0) {
            // Match employees logic could be here, for now just add strings
            // Ideally we match existing employees
            setNewTaskEmployees(prev => Array.from(new Set([...prev, ...data.assigned_to])))
        }
    }

    const handleCreate = async () => {
        if (!newTaskTitle.trim()) return
        await createTask({
            title: newTaskTitle,
            description: newTaskDescription || undefined,
            project_id: newTaskProjectId || undefined,
            priority: newTaskPriority,
            due_date: newTaskDueDate || undefined,
            assigned_to: newTaskEmployees.length > 0 ? newTaskEmployees : undefined,
        })
        setNewTaskTitle('')
        setNewTaskDescription('')
        setNewTaskProjectId('')
        setNewTaskPriority('media')
        setNewTaskDueDate('')
        setNewTaskEmployees([])
        setShowCreateForm(false)
    }

    const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
        await moveTask(taskId, newStatus)
        setMenuTask(null)
    }

    const handleDeleteTask = async (taskId: string) => {
        await deleteTask(taskId)
        setMenuTask(null)
    }

    const handleSaveDetail = async (id: string, updates: Record<string, unknown>) => {
        await updateTask(id, updates as any)
    }

    const handleDeleteDetail = async (id: string) => {
        await deleteTask(id)
    }

    return (
        <>
            <TopBar
                title="Tablero Kanban"
                subtitle={`${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} en total`}
                actions={
                    <>
                        <button
                            onClick={handleOpenCreate}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Nueva Tarea
                        </button>
                    </>
                }
            />

            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 lg:p-8 pb-4 bg-gray-100/50">
                {loading ? (
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="min-w-[300px] w-[300px] shrink-0">
                                <div className="skeleton h-12 w-full rounded-xl mb-3" />
                                <div className="skeleton h-28 w-full rounded-xl mb-3" />
                                <div className="skeleton h-28 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 lg:gap-6 items-start min-h-[calc(100vh-180px)]">
                            {STATUSES.map((status) => (
                                <KanbanColumn
                                    key={status}
                                    status={status}
                                    tasks={getTasksByStatus(status)}
                                    onMenuClick={(task) => setMenuTask(task)}
                                    onTaskClick={(task) => setDetailTask(task)}
                                />
                            ))}
                        </div>
                        <DragOverlay>
                            {activeTask ? (
                                <div className="rotate-2 scale-105 opacity-90 w-[300px]">
                                    <TaskCard task={activeTask} />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {/* Mobile FABs */}
                <button
                    onClick={handleOpenCreate}
                    className="sm:hidden fixed right-6 bottom-24 z-30 h-14 w-14 rounded-full bg-navy-900 shadow-lg flex items-center justify-center text-white hover:bg-navy-800 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-3xl icon-filled">add</span>
                </button>
            </main>

            {/* Task context menu */}
            {menuTask && (
                <div className="fixed inset-0 z-50 modal-overlay bg-black/40 flex items-center justify-center p-4" onClick={() => setMenuTask(null)}>
                    <div className="modal-sheet bg-white w-full max-w-sm rounded-2xl border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_#000000]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 bg-hc-accent rounded-lg border-2 border-black flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg text-white icon-filled">edit_note</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-black uppercase leading-none truncate">{menuTask.title}</h3>
                                <p className="text-xs font-bold text-gray-400 mt-0.5">{menuTask.project?.client || 'Sin proyecto'}</p>
                            </div>
                            <button onClick={() => setMenuTask(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <span className="material-symbols-outlined text-lg text-gray-400">close</span>
                            </button>
                        </div>

                        <p className="text-xs font-extrabold uppercase text-hc-accent mb-2.5 border-l-[3px] border-hc-accent pl-2">
                            Mover a
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {STATUSES.filter(s => s !== menuTask.status).map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleMoveTask(menuTask.id, status)}
                                    className="py-2.5 px-2 border-[2px] border-black bg-white text-black font-bold text-xs uppercase rounded-xl card-shadow-sm active:translate-y-[2px] active:shadow-none transition-all hover:bg-hc-accent-light text-center"
                                >
                                    {status === 'backlog' ? 'Pendiente' : status === 'por_hacer' ? 'Hoy' : status === 'en_proceso' ? 'En Curso' : 'Listo'}
                                </button>
                            ))}
                        </div>

                        {menuTask.status === 'en_proceso' && (
                            <div className="mb-5">
                                <p className="text-xs font-extrabold uppercase text-hc-accent mb-2 border-l-[3px] border-hc-accent pl-2">
                                    Progreso: {menuTask.progress ?? 0}%
                                </p>
                                <input
                                    type="range" min="0" max="100" step="5"
                                    value={menuTask.progress ?? 0}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value)
                                        updateTask(menuTask.id, { progress: val })
                                        setMenuTask({ ...menuTask, progress: val })
                                    }}
                                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hc-accent"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDeleteTask(menuTask.id)}
                                className="flex-1 py-3 px-3 border-[2px] border-red-500 bg-red-50 text-red-700 font-bold text-sm uppercase rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Eliminar
                            </button>
                            <button
                                onClick={() => setMenuTask(null)}
                                className="flex-1 py-3 px-3 border-[2px] border-black bg-white text-black font-bold text-sm uppercase rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create task modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateForm(false)}>
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-900">
                                    <span className="material-symbols-outlined text-2xl">add_task</span>
                                </div>
                                <h2 className="text-xl font-bold text-navy-900 uppercase tracking-tight">Nueva Tarea</h2>
                                <VoiceRecorderButton onProcessed={handleVoiceProcessed} size="sm" />
                            </div>
                            <button onClick={() => setShowCreateForm(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Tarea</label>
                                <input
                                    type="text" value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Ej: Cortar chapas del 18"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Descripción</label>
                                <textarea
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    placeholder="Detalle de la tarea..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                                <select value={newTaskProjectId} onChange={(e) => setNewTaskProjectId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                >
                                    <option value="">Sin proyecto</option>
                                    {projectsList.map(p => (
                                        <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Empleados Responsables</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {newTaskEmployees.map((emp, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-navy-700 uppercase">
                                            {emp}
                                            <button onClick={() => setNewTaskEmployees(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500 ml-1">×</button>
                                        </span>
                                    ))}
                                </div>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setNewTaskEmployees(prev => [...prev, e.target.value])
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                >
                                    <option value="">+ Agregar Empleado</option>
                                    {employees
                                        .filter(e => !newTaskEmployees.includes(`${e.first_name} ${e.last_name}`))
                                        .map(emp => (
                                            <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                                                {emp.first_name} {emp.last_name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Prioridad</label>
                                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                    >
                                        <option value="baja">🟢 Baja</option>
                                        <option value="media">🟡 Normal</option>
                                        <option value="alta">🔴 Urgente</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha Límite</label>
                                    <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreate} disabled={!newTaskTitle.trim()}
                                className="w-full py-3 bg-navy-900 text-white font-bold text-sm uppercase rounded-lg shadow-lg hover:bg-navy-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                <span className="material-symbols-outlined text-lg icon-filled">check_circle</span>
                                Crear Tarea
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {detailTask && (
                <TaskDetailModal
                    task={detailTask}
                    projects={projectsList}
                    onSave={handleSaveDetail}
                    onDelete={handleDeleteDetail}
                    onClose={() => setDetailTask(null)}
                />
            )}
        </>
    )
}
