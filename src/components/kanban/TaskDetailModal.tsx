import { useState, useEffect } from 'react'
import type { Task, TaskPriority, TaskStatus } from '../../types/database'
import { useTaskComments } from '../../hooks/useTaskComments'
import { useEmployees } from '../../hooks/useEmployees'
import { AttachmentGallery } from './AttachmentGallery'
import { formatDate, cn } from '../../lib/utils'
import { VoiceRecorderButton } from '../ui/VoiceRecorderButton'
import type { AITaskExtraction } from '../../lib/gemini'

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
    const [activeTab, setActiveTab] = useState<'detail' | 'comments' | 'attachments'>('detail')
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const { comments, loading: commentsLoading, addComment, deleteComment } = useTaskComments(task.id)
    const { employees: allEmployees } = useEmployees()
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

    // Voice Handler
    const handleVoiceProcessed = async (data: AITaskExtraction) => {
        const updates: any = {}
        if (data.description) {
            updates.description = description + '\n\n' + data.description
            setDescription(prev => prev + '\n\n' + data.description)
        }
        if (data.priority && data.priority !== priority) {
            updates.priority = data.priority
            setPriority(data.priority)
        }
        // Save automatically
        if (Object.keys(updates).length > 0) {
            await handleSaveField(updates)
        }

        const handleSaveField = async (updatedFields: Partial<Task>) => {
            setSaving(true)
            await onSave(task.id, {
                ...updatedFields
            })
            setSaving(false)
        }

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
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
                <div
                    className="bg-white w-full sm:max-w-xl sm:rounded-xl rounded-t-xl shadow-2xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight">Detalle de Tarea</h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 shrink-0 px-6 gap-6">
                        <button
                            onClick={() => setActiveTab('detail')}
                            className={cn(
                                "py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
                                activeTab === 'detail' ? "border-navy-900 text-navy-900" : "border-transparent text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">edit_note</span>
                            Detalles
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={cn(
                                "py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
                                activeTab === 'comments' ? "border-navy-900 text-navy-900" : "border-transparent text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">chat</span>
                            Notas <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">{comments.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={cn(
                                "py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
                                activeTab === 'attachments' ? "border-navy-900 text-navy-900" : "border-transparent text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">attach_file</span>
                            Adjuntos
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'detail' ? (
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Título</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base font-bold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <label className="text-xs font-extrabold uppercase text-hc-accent block border-l-[3px] border-hc-accent pl-2">Descripción</label>
                                        <VoiceRecorderButton onProcessed={handleVoiceProcessed} size="sm" />
                                    </div>                                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Añadir descripción..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 bg-white placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">Estado</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {statusOptions.map(opt => (
                                            <button key={opt.value} onClick={() => setStatus(opt.value)}
                                                className={cn(
                                                    "py-2 px-1 rounded-lg border text-[11px] font-bold uppercase flex flex-col items-center gap-1 transition-all",
                                                    status === opt.value
                                                        ? "border-navy-900 bg-navy-900 text-white shadow-md"
                                                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                                                )}
                                            >
                                                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Project & Priority Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Proyecto</label>
                                        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            <option value="">Sin proyecto</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.client} — {p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Prioridad</label>
                                        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-navy-900 bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            <option value="baja">Baja</option>
                                            <option value="media">Alta / Normal</option>
                                            <option value="alta">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Employees & Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Asignados</label>
                                        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                                            {employees.map((emp, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-navy-700 uppercase">
                                                    {emp}
                                                    <button onClick={() => setEmployees(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500 ml-1">×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <select
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setEmployees(prev => [...prev, e.target.value])
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        >
                                            <option value="">+ Agregar</option>
                                            {allEmployees
                                                .filter(e => !employees.includes(`${e.first_name} ${e.last_name}`))
                                                .map(emp => (
                                                    <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                                                        {emp.first_name} {emp.last_name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Fecha Límite</label>
                                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Progress */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block tracking-wide">Progreso: {progress}%</label>
                                    <input type="range" min="0" max="100" step="5" value={progress}
                                        onChange={(e) => setProgress(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-900"
                                    />
                                </div>

                                {/* Delete */}
                                <div className="pt-6 mt-4 border-t border-gray-100 text-right">
                                    {confirmDelete ? (
                                        <div className="flex items-center justify-end gap-3">
                                            <p className="text-sm font-medium text-red-600 mr-2">¿Seguro?</p>
                                            <button onClick={handleDeleteConfirm}
                                                className="px-4 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-700">Sí, eliminar</button>
                                            <button onClick={() => setConfirmDelete(false)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs uppercase rounded-lg hover:bg-gray-50">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmDelete(true)}
                                            className="text-red-500 hover:text-red-700 font-bold text-xs uppercase hover:underline flex items-center gap-1 ml-auto">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Eliminar Tarea
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'comments' ? (
                            /* Comments Tab */
                            <div className="space-y-4">
                                {commentsLoading ? (
                                    <p className="text-center text-sm font-medium text-gray-400 py-8">Cargando notas...</p>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">chat_bubble_outline</span>
                                        <p className="text-sm font-medium text-gray-500">No hay notas registradas</p>
                                    </div>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 group hover:border-gray-300 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-extrabold uppercase text-navy-800 tracking-wide flex items-center gap-1">
                                                    <span className="w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center text-[10px] text-navy-700">
                                                        {c.author.charAt(0)}
                                                    </span>
                                                    {c.author}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium text-gray-400">{formatDate(c.created_at)}</span>
                                                    <button onClick={() => deleteComment(c.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{c.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : activeTab === 'attachments' ? (
                            <AttachmentGallery taskId={task.id} />
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-xl">
                        {activeTab === 'comments' ? (
                            <div className="flex gap-2">
                                <input type="text" value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
                                    placeholder="Escribir nota..."
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                />
                                <button onClick={handleAddComment} disabled={!commentInput.trim()}
                                    className="px-4 py-2.5 bg-navy-900 text-white hover:bg-navy-800 font-bold text-xs uppercase rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg icon-filled">send</span>
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleSave} disabled={saving || !title.trim()}
                                className="w-full py-3 bg-navy-900 text-white font-bold text-sm uppercase rounded-lg shadow-lg hover:bg-navy-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
