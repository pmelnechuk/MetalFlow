import { useState, useEffect } from 'react'
import type { Task, TaskPriority, TaskStatus } from '../../types/database'
import { useTaskComments } from '../../hooks/useTaskComments'
import { AttachmentGallery } from './AttachmentGallery'
import { formatDate } from '../../lib/utils'

interface TaskDetailModalProps {
    task: Task
    projects: { id: string; name: string; client: string }[]
    onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onClose: () => void
}

export function TaskDetailModal({ task, projects, onSave, onDelete, onClose }: TaskDetailModalProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [projectId, setProjectId] = useState(task.project_id || '')
    const [priority, setPriority] = useState<TaskPriority>(task.priority || 'media')
    const [status, setStatus] = useState<TaskStatus>(task.status || 'backlog')
    const [dueDate, setDueDate] = useState(task.due_date || '')
    const [progress, setProgress] = useState(task.progress || 0)
    const [employees, setEmployees] = useState<string[]>(task.assigned_to || [])
    const [employeeInput, setEmployeeInput] = useState('')
    const [activeTab, setActiveTab] = useState<'detail' | 'comments' | 'attachments'>('detail')
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const { comments, loading: commentsLoading, addComment, deleteComment } = useTaskComments(task.id)
    const [commentInput, setCommentInput] = useState('')

    // Reset when task changes
    useEffect(() => {
        setTitle(task.title)
        setDescription(task.description || '')
        setProjectId(task.project_id || '')
        setPriority(task.priority || 'media')
        setStatus(task.status || 'backlog')
        setDueDate(task.due_date || '')
        setProgress(task.progress || 0)
        setEmployees(task.assigned_to || [])
    }, [task])

    const handleSave = async () => {
        setSaving(true)
        await onSave(task.id, {
            title,
            description: description || null,
            project_id: projectId || null,
            priority,
            status,
            due_date: dueDate || null,
            progress,
            assigned_to: employees,
        })
        setSaving(false)
        onClose()
    }

    const handleDeleteConfirm = async () => {
        await onDelete(task.id)
        onClose()
    }

    const handleAddComment = async () => {
        if (!commentInput.trim()) return
        await addComment(commentInput)
        setCommentInput('')
    }

    const statusOptions: { value: TaskStatus; label: string; icon: string }[] = [
        { value: 'backlog', label: 'Pendiente', icon: 'inbox' },
        { value: 'por_hacer', label: 'Para Hoy', icon: 'today' },
        { value: 'en_proceso', label: 'En Proceso', icon: 'autorenew' },
        { value: 'terminado', label: 'Terminado', icon: 'check_circle' },
    ]

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div
                className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border-t-[3px] sm:border-[3px] border-black max-h-[90vh] flex flex-col shadow-[6px_6px_0px_0px_#000000]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-[2px] border-black shrink-0">
                    <h2 className="text-base font-black uppercase tracking-tight">Detalle de Tarea</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg border-[2px] border-black flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-[2px] border-black shrink-0">
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-colors ${activeTab === 'detail' ? 'bg-hc-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1 icon-filled">edit_note</span>
                        Editar
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-l-[2px] border-black ${activeTab === 'comments' ? 'bg-hc-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1 icon-filled">chat</span>
                        Notas ({comments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('attachments')}
                        className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-l-[2px] border-black ${activeTab === 'attachments' ? 'bg-hc-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1 icon-filled">attach_file</span>
                        Adjuntos
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'detail' ? (
                        <div className="space-y-3.5">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Título</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border-[2px] border-black rounded-xl text-sm font-black text-black bg-white focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Descripción</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalle de la tarea..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 border-[2px] border-black rounded-xl text-sm font-bold text-black bg-white placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Estado</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {statusOptions.map(opt => (
                                        <button key={opt.value} onClick={() => setStatus(opt.value)}
                                            className={`py-2 px-1 rounded-xl border-[2px] text-[10px] font-extrabold uppercase flex flex-col items-center gap-0.5 transition-all ${status === opt.value
                                                ? 'border-hc-accent bg-hc-accent text-white shadow-[2px_2px_0px_0px_#000000]'
                                                : 'border-black bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-base icon-filled">{opt.icon}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Project */}
                            <div>
                                <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Proyecto</label>
                                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border-[2px] border-black rounded-xl text-sm font-bold text-black bg-white focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                                >
                                    <option value="">Sin proyecto</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Employees */}
                            <div>
                                <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Empleados</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {employees.map((emp, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-hc-accent-light border-[2px] border-hc-accent rounded-lg text-[10px] font-extrabold text-hc-accent-dark uppercase">
                                            {emp}
                                            <button onClick={() => setEmployees(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input type="text" value={employeeInput}
                                    onChange={(e) => setEmployeeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ',') && employeeInput.trim()) {
                                            e.preventDefault()
                                            setEmployees(prev => [...prev, employeeInput.trim()])
                                            setEmployeeInput('')
                                        }
                                    }}
                                    placeholder="Nombre + Enter"
                                    className="w-full px-3.5 py-2.5 border-[2px] border-black rounded-xl text-sm font-bold text-black bg-white placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Priority + Date + Progress */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Prioridad</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                        className="w-full px-2 py-2.5 border-[2px] border-black rounded-xl text-xs font-bold text-black bg-white focus:border-hc-accent focus:ring-0 focus:outline-none"
                                    >
                                        <option value="baja">🟢 Baja</option>
                                        <option value="media">🟡 Normal</option>
                                        <option value="alta">🔴 Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Fecha</label>
                                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-2 py-2.5 border-[2px] border-black rounded-xl text-xs font-bold text-black bg-white focus:border-hc-accent focus:ring-0 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold uppercase text-hc-accent block mb-1 border-l-[3px] border-hc-accent pl-2">Progreso</label>
                                    <div className="flex items-center gap-1.5 border-[2px] border-black rounded-xl px-2 py-2.5 bg-white">
                                        <input type="range" min="0" max="100" step="5" value={progress}
                                            onChange={(e) => setProgress(Number(e.target.value))}
                                            className="flex-1 accent-hc-accent h-1.5"
                                        />
                                        <span className="text-[10px] font-black text-hc-accent w-8 text-right">{progress}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delete */}
                            <div className="pt-2 border-t-[2px] border-gray-200">
                                {confirmDelete ? (
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-red-600 flex-1">¿Eliminar esta tarea?</p>
                                        <button onClick={handleDeleteConfirm}
                                            className="px-3 py-2 border-[2px] border-red-500 bg-red-500 text-white font-bold text-xs uppercase rounded-xl">Sí</button>
                                        <button onClick={() => setConfirmDelete(false)}
                                            className="px-3 py-2 border-[2px] border-black bg-white text-black font-bold text-xs uppercase rounded-xl">No</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setConfirmDelete(true)}
                                        className="w-full py-2.5 border-[2px] border-red-400 bg-red-50 text-red-700 font-bold text-xs uppercase rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Eliminar Tarea
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'comments' ? (
                        /* Comments Tab */
                        <div className="space-y-3">
                            {commentsLoading ? (
                                <p className="text-center text-xs font-bold text-gray-400 py-6">Cargando notas...</p>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">chat_bubble_outline</span>
                                    <p className="text-xs font-bold text-gray-400">Sin notas aún</p>
                                </div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="border-[2px] border-black rounded-xl p-3 bg-white group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-extrabold uppercase text-hc-accent">
                                                <span className="material-symbols-outlined text-xs align-middle mr-0.5">person</span>
                                                {c.author}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-gray-400">{formatDate(c.created_at)}</span>
                                                <button onClick={() => deleteComment(c.id)}
                                                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 transition-all">
                                                    <span className="material-symbols-outlined text-xs text-red-400">close</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 leading-snug">{c.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : activeTab === 'attachments' ? (
                        <AttachmentGallery taskId={task.id} />
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t-[2px] border-black shrink-0">
                    {activeTab === 'comments' ? (
                        <div className="flex gap-2">
                            <input type="text" value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
                                placeholder="Escribir nota..."
                                className="flex-1 px-3.5 py-2.5 border-[2px] border-black rounded-xl text-sm font-bold bg-white placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none"
                            />
                            <button onClick={handleAddComment} disabled={!commentInput.trim()}
                                className="px-4 py-2.5 border-[2px] border-black bg-hc-accent text-white font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_#000000] active:translate-y-[1px] active:shadow-none disabled:opacity-40"
                            >
                                <span className="material-symbols-outlined text-base icon-filled">send</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleSave} disabled={saving || !title.trim()}
                            className="w-full py-3 border-[3px] border-black bg-hc-accent text-white font-black text-sm uppercase rounded-xl shadow-[3px_3px_0px_0px_#000000] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-lg icon-filled">{saving ? 'hourglass_top' : 'save'}</span>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
