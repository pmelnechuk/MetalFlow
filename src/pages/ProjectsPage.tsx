import { useState, useCallback } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useRealtimeTasks } from '../hooks/useRealtimeTasks'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectForm } from '../components/projects/ProjectForm'
import { TopBar } from '../components/layout/TopBar'
import { cn } from '../lib/utils'

export function ProjectsPage() {
    const { projects, loading, filter, setFilter, createProject, updateProject, searchProjects, refetch } = useProjects()
    const [showForm, setShowForm] = useState(false)
    const [editingProject, setEditingProject] = useState<{ id: string; name: string; client: string } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

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

    return (
        <>
            <TopBar
                title="Proyectos"
                subtitle={`${projects.length} proyecto${projects.length !== 1 ? 's' : ''} · ${filter === 'activo' ? 'Activos' : 'Archivados'}`}
                actions={
                    <>
                        <button
                            onClick={() => setShowForm(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 border-[3px] border-black bg-hc-accent text-white font-black text-sm uppercase rounded-xl shadow-[3px_3px_0px_0px_#000000] active:translate-y-[1px] active:shadow-none transition-all hover:bg-hc-accent-dark"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Nuevo Proyecto
                        </button>
                        <button
                            aria-label="Notificaciones"
                            className="p-2.5 border-[2px] border-black rounded-xl hover:bg-hc-highlight transition-all active:translate-y-[1px] relative"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </>
                }
            >
                {/* Search + Filters row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-400 text-xl">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border-[2px] border-black rounded-xl bg-white text-sm font-bold text-black placeholder-gray-400 focus:border-hc-accent focus:ring-0 focus:outline-none transition-colors"
                            placeholder="Buscar proyecto o cliente..."
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setFilter('activo')}
                            className={cn(
                                'px-4 py-2.5 border-[2px] border-black font-extrabold text-sm uppercase rounded-xl transition-all flex items-center gap-1.5',
                                filter === 'activo'
                                    ? 'bg-hc-accent text-white shadow-[2px_2px_0px_0px_#000000]'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            )}
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Activos
                        </button>
                        <button
                            onClick={() => setFilter('inactivo')}
                            className={cn(
                                'px-4 py-2.5 border-[2px] border-black font-bold text-sm uppercase rounded-xl transition-all flex items-center gap-1.5',
                                filter === 'inactivo'
                                    ? 'bg-hc-accent text-white shadow-[2px_2px_0px_0px_#000000]'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            )}
                        >
                            <span className="material-symbols-outlined text-base">archive</span>
                            Archivados
                        </button>
                    </div>
                </div>
            </TopBar>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="border-[3px] border-gray-200 rounded-xl p-5">
                                <div className="skeleton h-4 w-28 mb-3" />
                                <div className="skeleton h-6 w-full mb-3" />
                                <div className="skeleton h-7 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center p-8">
                            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl border-[3px] border-gray-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-gray-300">folder_off</span>
                            </div>
                            <p className="text-xl font-black uppercase text-gray-400 mb-1">
                                {filter === 'activo' ? 'Sin proyectos activos' : 'Sin proyectos archivados'}
                            </p>
                            <p className="text-sm font-bold text-gray-400 mb-6">
                                Creá un proyecto para empezar a cargar tareas
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-6 py-3 border-[3px] border-black bg-hc-accent text-white font-black text-sm uppercase rounded-xl shadow-[3px_3px_0px_0px_#000000] active:translate-y-[1px] active:shadow-none transition-all inline-flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Crear Proyecto
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projects.map((project, i) => (
                            <div
                                key={project.id}
                                className="stagger-item"
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
                    className="sm:hidden fab-button fixed right-5 bottom-24 z-30 h-14 w-14 rounded-2xl bg-hc-accent border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center text-white"
                >
                    <span className="material-symbols-outlined text-3xl icon-filled">add</span>
                </button>
            </main>

            {/* Create/Edit modal */}
            {(showForm || editingProject) && (
                <div className="fixed inset-0 z-50 modal-overlay bg-black/40 flex items-center justify-center p-4">
                    <div className="modal-sheet bg-white w-full max-w-md rounded-2xl border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_#000000]">
                        <ProjectForm
                            initialData={editingProject ? { name: editingProject.name, client: editingProject.client } : undefined}
                            onSubmit={editingProject ? handleEdit : handleCreate}
                            onCancel={() => { setShowForm(false); setEditingProject(null) }}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
