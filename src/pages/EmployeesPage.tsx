
import { useState } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import { TopBar } from '../components/layout/TopBar'
import { cn } from '../lib/utils'
import type { Employee } from '../types/database'

export function EmployeesPage() {
    const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees()
    const [showForm, setShowForm] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [formData, setFormData] = useState({ first_name: '', last_name: '', role: '', status: 'active' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingEmployee) {
                await updateEmployee(editingEmployee.id, formData)
            } else {
                await createEmployee(formData as any)
            }
            setShowForm(false)
            setEditingEmployee(null)
            setFormData({ first_name: '', last_name: '', role: '', status: 'active' })
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee)
        setFormData({
            first_name: employee.first_name,
            last_name: employee.last_name,
            role: employee.role,
            status: employee.status
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este empleado?')) {
            await deleteEmployee(id)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar
                title="Personal"
                subtitle={`${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
                actions={
                    <button
                        onClick={() => {
                            setEditingEmployee(null)
                            setFormData({ first_name: '', last_name: '', role: '', status: 'active' })
                            setShowForm(true)
                        }}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-navy-800 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nuevo Empleado
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                <div className="animate-pulse h-6 w-full mb-3 bg-gray-200 rounded" />
                                <div className="animate-pulse h-4 w-24 rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">group_off</span>
                        <p className="text-gray-500 font-medium">No hay empleados registrados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employees.map((employee) => (
                            <div key={employee.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-700 font-bold text-lg">
                                        {employee.first_name[0]}{employee.last_name[0]}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(employee)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-navy-900">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(employee.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-navy-900 leading-tight mb-1">
                                    {employee.first_name} {employee.last_name}
                                </h3>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                    {employee.role}
                                </p>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    employee.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                )}>
                                    {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-navy-900 mb-6">
                            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol / Cargo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Soldador, Armador..."
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-600 font-bold text-sm uppercase hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-navy-900 text-white font-bold text-sm uppercase rounded-lg shadow hover:bg-navy-800 transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
