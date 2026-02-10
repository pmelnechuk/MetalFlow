import { useState, useCallback } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useRealtimeTasks } from '../hooks/useRealtimeTasks'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectForm } from '../components/projects/ProjectForm'
import { TopBar } from '../components/layout/TopBar'
import { cn } from '../lib/utils'

export function ProjectsPage() {
    const { projects, loading, filter, setFilter, createProject, updateProject, deleteProject, searchProjects, refetch } = useProjects()
    const [showForm, setShowForm] = useState(false)
    const [editingProject, setEditingProject] = useState<{ id: string; name: string; client: string } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    useRealtimeTasks(useCallback(() => { refetch() }, [refetch]))

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        searchProjects(query)
    }

    const handleCreate = async (data: { name: string; client: string }) => {
        await createProject(data)
        setShowForm(false)
    }

    const handleEdit = async (data: { name: string; client: string }) => {
        if (editingProject) {
            await updateProject(editingProject.id, data)
            setEditingProject(null)
        }
    }

    const handleDelete = async (id: string) => {
        await deleteProject(id)
        setConfirmDelete(null)
        setEditingProject(null)
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar
                title="Proyectos"
                subtitle={`${projects.length} proyecto${projects.length !== 1 ? 's' : ''} · ${filter === 'activo' ? 'Activos' : 'Archivados'}`}
                actions={
                    <>
                        <button
                            onClick={() => setShowForm(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Nuevo Proyecto
                        </button>
                    </>
                }
            >
                {/* Search + Filters row */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-400 text-xl">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all shadow-sm"
                            placeholder="Buscar proyecto o cliente..."
                        />
                    </div>
                    <div className="flex gap-2 shrink-0 bg-white p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setFilter('activo')}
                            className={cn(
                                'px-3 py-1.5 font-bold text-xs uppercase rounded-md transition-all flex items-center gap-1.5',
                                filter === 'activo'
                                    ? 'bg-navy-50 text-navy-900 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                            )}
                        >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Activos
                        </button>
                        <button
                            onClick={() => setFilter('inactivo')}
                            className={cn(
                                'px-3 py-1.5 font-bold text-xs uppercase rounded-md transition-all flex items-center gap-1.5',
                                filter === 'inactivo'
                                    ? 'bg-navy-50 text-navy-900 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                            )}
                        >
                            <span className="material-symbols-outlined text-sm">archive</span>
                            Archivados
                        </button>
                    </div>
                </div>
            </TopBar>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                <div className="animate-pulse h-4 w-28 mb-3 bg-gray-200 rounded" />
                                <div className="animate-pulse h-6 w-full mb-3 bg-gray-200 rounded" />
                                <div className="animate-pulse h-7 w-24 rounded-full bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 max-w-sm w-full mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                <span className="material-symbols-outlined text-4xl">folder_off</span>
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 mb-1">
                                {filter === 'activo' ? 'Sin proyectos activos' : 'Sin proyectos archivados'}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 mb-6 px-4">
                                Comienza creando un nuevo proyecto para gestionar tus tareas.
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-6 py-2.5 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow hover:bg-navy-800 transition-all inline-flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Crear Proyecto
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {projects.map((project, i) => (
                            <div
                                key={project.id}
                                className="transform transition-all duration-300"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <ProjectCard
                                    project={project}
                                    onPress={() => setEditingProject({ id: project.id, name: project.name, client: project.client })}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Mobile FAB */}
                <button
                    onClick={() => setShowForm(true)}
                    className="sm:hidden fixed right-6 bottom-24 z-30 h-14 w-14 rounded-full bg-navy-900 shadow-lg flex items-center justify-center text-white hover:bg-navy-800 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-3xl icon-filled">add</span>
                </button>
            </main>

            {/* Create/Edit modal */}
            {(showForm || editingProject) && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingProject(null); }}>
                    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <ProjectForm
                            initialData={editingProject ? { name: editingProject.name, client: editingProject.client } : undefined}
                            onSubmit={editingProject ? handleEdit : handleCreate}
                            onCancel={() => { setShowForm(false); setEditingProject(null); setConfirmDelete(null); }}
                        />

                        {editingProject && (
                            <div className="mt-4 flex flex-col items-center">
                                {confirmDelete === editingProject.id ? (
                                    <div className="bg-white rounded-lg p-2 shadow-lg border border-red-100 inline-flex items-center gap-3 animate-pulse">
                                        <p className="text-xs font-bold text-red-600 pl-2">¿Eliminar?</p>
                                        <button
                                            onClick={() => handleDelete(editingProject.id)}
                                            className="px-3 py-1.5 bg-red-600 text-white font-bold text-[10px] uppercase rounded hover:bg-red-700"
                                        >
                                            Sí
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded hover:bg-gray-200"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(editingProject.id)}
                                        className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-red-500 font-bold text-xs uppercase hover:bg-white hover:text-red-700 hover:shadow transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                        Eliminar Proyecto
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
