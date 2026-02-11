import { useState, useEffect } from 'react'
import { useEmployees } from '../../hooks/useEmployees'
import { useProjects } from '../../hooks/useProjects'
import { VoiceRecorderButton } from '../ui/VoiceRecorderButton'
import type { AITaskExtraction } from '../../lib/gemini'

interface ProjectFormProps {
    onSubmit: (data: { name: string; client: string; employeeIds: string[] }) => void
    onCancel: () => void
    initialData?: { id?: string; name: string; client: string }
}

export function ProjectForm({ onSubmit, onCancel, initialData }: ProjectFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [client, setClient] = useState(initialData?.client || '')
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

    const { employees } = useEmployees()
    const { getProjectEmployees } = useProjects()

    useEffect(() => {
        if (initialData?.id) {
            getProjectEmployees(initialData.id).then(ids => {
                setSelectedEmployees(ids)
            })
        }
    }, [initialData?.id, getProjectEmployees])

    const handleVoiceProcessed = (data: AITaskExtraction) => {
        if (data.task) setName(data.task) // Map task title to Project Name
        if (data.project) setClient(data.project) // Map project to Client

        if (data.assigned_to && data.assigned_to.length > 0) {
            // Find employee IDs by name match
            const matchedIds = employees
                .filter(e => data.assigned_to.some(name =>
                    `${e.first_name} ${e.last_name}`.toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(e.first_name.toLowerCase())
                ))
                .map(e => e.id)

            setSelectedEmployees(prev => Array.from(new Set([...prev, ...matchedIds])))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !client.trim()) return
        onSubmit({
            name: name.trim(),
            client: client.trim(),
            employeeIds: selectedEmployees
        })
    }

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev =>
            prev.includes(id)
                ? prev.filter(e => e !== id)
                : [...prev, id]
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight flex items-center gap-2">
                    {initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                    <VoiceRecorderButton onProcessed={handleVoiceProcessed} size="sm" />
                </h2>
                <button
                    onClick={onCancel}
                    className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center transition-all text-gray-400"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">
                            Nombre del Proyecto
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Estructura de Vigas IPN"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-semibold text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">
                            Cliente
                        </label>
                        <input
                            type="text"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            placeholder="Ej: Tinglado S.A."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-semibold text-navy-900 placeholder-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wide">
                            Equipo Asignado
                        </label>
                        <div className="border border-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                            {employees.length === 0 ? (
                                <p className="text-sm text-gray-400 p-3 text-center">No hay empleados registrados</p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {employees.map(emp => {
                                        const isSelected = selectedEmployees.includes(emp.id)
                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => toggleEmployee(emp.id)}
                                                className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-navy-900 border-navy-900' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold leading-none ${isSelected ? 'text-navy-900' : 'text-gray-700'}`}>
                                                        {emp.first_name} {emp.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">{emp.role}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3 shrink-0 bg-white border-t border-transparent z-10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold text-sm uppercase rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || !client.trim()}
                        className="flex-1 py-3 px-4 bg-navy-900 text-white font-bold text-sm uppercase rounded-lg shadow-md hover:bg-navy-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-xl icon-filled">check</span>
                        {initialData ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </div>
    )
}
