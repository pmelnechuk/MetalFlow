import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { TopBar } from '../layout/TopBar'
import type { TaskPriority } from '../../types/database'

export function AIReviewScreen() {
    const navigate = useNavigate()
    const location = useLocation()
    const { createTask } = useTasks()
    const { allProjects } = useProjects()
    const [saving, setSaving] = useState(false)

    const mockData = location.state?.mockData || {
        project: 'TINGLADO S.A.',
        task: 'ESTRUCTURA DE VIGAS IPN',
        priority: 'alta',
        due_date: new Date().toISOString().split('T')[0],
    }

    const [project, setProject] = useState(mockData.project)
    const [task, setTask] = useState(mockData.task)
    const [priority, setPriority] = useState<TaskPriority>(mockData.priority)
    const [dueDate, setDueDate] = useState(mockData.due_date)
    const [projectsList, setProjectsList] = useState<{ id: string; name: string; client: string }[]>([])
    const [matchedProjectId, setMatchedProjectId] = useState<string | null>(null)

    useEffect(() => {
        allProjects().then(projects => {
            setProjectsList(projects)
            const match = projects.find(p =>
                p.client.toLowerCase().includes(project.toLowerCase()) ||
                p.name.toLowerCase().includes(project.toLowerCase()) ||
                project.toLowerCase().includes(p.client.toLowerCase())
            )
            if (match) setMatchedProjectId(match.id)
        })
    }, [allProjects, project])

    const handleConfirm = async () => {
        setSaving(true)
        await createTask({
            title: task,
            project_id: matchedProjectId || undefined,
            priority,
            due_date: dueDate || undefined,
            status: 'backlog',
        })
        setSaving(false)
        navigate('/tablero')
    }

    const priorityConfig: Record<string, { emoji: string; bg: string }> = {
        alta: { emoji: '🔴', bg: 'bg-red-50' },
        media: { emoji: '🟡', bg: 'bg-amber-50' },
        baja: { emoji: '🟢', bg: 'bg-green-50' },
    }

    const currentPriority = priorityConfig[priority] || priorityConfig.media

    return (
        <>
            <TopBar
                title="Revisión IA"
                subtitle="Verificá los datos extraídos de la grabación"
                actions={
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-2 border-[2px] border-black rounded-xl text-sm font-bold uppercase hover:bg-hc-surface transition-all"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Volver
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                <div className="max-w-xl mx-auto">
                    {/* Info banner */}
                    <div className="bg-hc-accent-light border-[2px] border-hc-accent rounded-xl p-3.5 flex items-start gap-3 mb-6">
                        <span className="material-symbols-outlined text-lg text-hc-accent mt-0.5 icon-filled">smart_toy</span>
                        <p className="text-sm font-bold text-hc-accent-dark leading-snug">
                            Estos datos fueron extraídos automáticamente. Editá lo que necesites y confirmá para crear la tarea.
                        </p>
                    </div>

                    {/* Form card */}
                    <div className="bg-white border-[3px] border-black rounded-2xl p-6 card-shadow space-y-5">
                        {/* Proyecto */}
                        <div>
                            <label className="text-xs font-extrabold text-hc-accent uppercase tracking-wider block mb-1.5 border-l-[3px] border-hc-accent pl-2">
                                Proyecto
                            </label>
                            {projectsList.length > 0 ? (
                                <select
                                    value={matchedProjectId || ''}
                                    onChange={(e) => {
                                        setMatchedProjectId(e.target.value || null)
                                        const p = projectsList.find(pr => pr.id === e.target.value)
                                        if (p) setProject(p.client)
                                    }}
                                    className="w-full px-3.5 py-3 border-[2px] border-black rounded-xl text-base font-black text-black uppercase bg-white focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                                >
                                    <option value="">Sin proyecto</option>
                                    {projectsList.map(p => (
                                        <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-base font-black text-black uppercase px-3.5 py-3 border-[2px] border-gray-200 rounded-xl">{project}</p>
                            )}
                        </div>

                        {/* Tarea */}
                        <div>
                            <label className="text-xs font-extrabold text-hc-accent uppercase tracking-wider block mb-1.5 border-l-[3px] border-hc-accent pl-2">
                                Tarea Identificada
                            </label>
                            <input
                                type="text" value={task}
                                onChange={(e) => setTask(e.target.value)}
                                className="w-full px-3.5 py-3 border-[2px] border-black rounded-xl text-base font-black text-black uppercase bg-white focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Prioridad + Fecha in row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-extrabold text-hc-accent uppercase tracking-wider block mb-1.5 border-l-[3px] border-hc-accent pl-2">
                                    Prioridad
                                </label>
                                <div className={`flex items-center gap-2 border-[2px] border-black rounded-xl ${currentPriority.bg} overflow-hidden`}>
                                    <span className="text-lg pl-3">{currentPriority.emoji}</span>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                        className="flex-1 py-3 pr-3 text-sm font-black text-black uppercase bg-transparent border-none focus:ring-0 focus:outline-none"
                                    >
                                        <option value="alta">URGENTE</option>
                                        <option value="media">NORMAL</option>
                                        <option value="baja">BAJA</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-extrabold text-hc-accent uppercase tracking-wider block mb-1.5 border-l-[3px] border-hc-accent pl-2">
                                    Fecha Límite
                                </label>
                                <div className="flex items-center gap-2 border-[2px] border-black rounded-xl bg-white overflow-hidden">
                                    <span className="material-symbols-outlined text-base text-hc-accent pl-3 icon-filled">calendar_month</span>
                                    <input
                                        type="date" value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="flex-1 py-3 pr-3 text-sm font-black text-black bg-transparent border-none focus:ring-0 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={saving || !task.trim()}
                            className="flex-1 py-4 px-4 border-[3px] border-black bg-hc-accent text-white font-black text-lg uppercase rounded-xl shadow-[4px_4px_0px_0px_#000000] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-2xl icon-filled">check_circle</span>
                                    Confirmar y Crear
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="sm:w-auto py-4 px-6 border-[3px] border-black bg-white text-black font-black text-lg uppercase rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                            Cancelar
                        </button>
                    </div>
                </div>
            </main>
        </>
    )
}
