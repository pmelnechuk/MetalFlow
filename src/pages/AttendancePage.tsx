import { useState, useEffect } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendance } from '../hooks/useAttendance'
import { TopBar } from '../components/layout/TopBar'
import { cn } from '../lib/utils'

export function AttendancePage() {
    const { employees } = useEmployees()
    const { logs, fetchDailyLogs, checkIn, checkOut } = useAttendance()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        fetchDailyLogs()
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [fetchDailyLogs])

    const getEmployeeStatus = (employeeId: string) => {
        const log = logs.find(l => l.employee_id === employeeId)
        if (!log) return 'pending' // No ha llegado
        if (log.check_out) return 'completed' // Ya se fue
        return 'working' // Está trabajando
    }

    const handleAction = async (employeeId: string) => {
        const status = getEmployeeStatus(employeeId)
        if (status === 'pending') {
            await checkIn(employeeId)
        } else if (status === 'working') {
            const log = logs.find(l => l.employee_id === employeeId)
            if (log) await checkOut(log.id)
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar
                title="Asistencia"
                subtitle={currentTime.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                actions={
                    <div className="text-2xl font-black text-navy-900 font-mono bg-white px-4 py-1 rounded-lg shadow-sm border border-gray-100">
                        {formatTime(currentTime)}
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                {/* Kiosco Grid */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-navy-900 mb-4 uppercase tracking-wide">Registro Rápido</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {employees.filter(e => e.status === 'active').map(employee => {
                            const status = getEmployeeStatus(employee.id)
                            const log = logs.find(l => l.employee_id === employee.id)

                            return (
                                <button
                                    key={employee.id}
                                    onClick={() => handleAction(employee.id)}
                                    disabled={status === 'completed'}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 group",
                                        status === 'pending' && "bg-white border-gray-200 hover:border-navy-500 hover:shadow-lg",
                                        status === 'working' && "bg-green-50 border-green-500 shadow-md",
                                        status === 'completed' && "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-3 transition-colors",
                                        status === 'pending' && "bg-navy-50 text-navy-700 group-hover:bg-navy-100",
                                        status === 'working' && "bg-green-100 text-green-700 animate-pulse",
                                        status === 'completed' && "bg-gray-200 text-gray-500"
                                    )}>
                                        {employee.first_name[0]}{employee.last_name[0]}
                                    </div>
                                    <h3 className="font-bold text-navy-900 text-sm mb-1">{employee.first_name}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        {status === 'pending' ? 'Marcar Entrada' :
                                            status === 'working' ? 'Marcar Salida' : 'Jornada Finalizada'}
                                    </span>

                                    {status === 'working' && log?.check_in && (
                                        <div className="mt-2 text-xs font-mono text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                            {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Daily Log Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-navy-900 uppercase">Registros de Hoy</h3>
                        <span className="text-xs font-medium text-gray-500">
                            {logs.length} registros
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Empleado</th>
                                    <th className="px-6 py-3">Entrada</th>
                                    <th className="px-6 py-3">Salida</th>
                                    <th className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                            No hay registros de asistencia hoy.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 font-medium text-navy-900">
                                                {(log as any).employee?.first_name} {(log as any).employee?.last_name}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-gray-600">
                                                {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-gray-600">
                                                {log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    log.status === 'presente' && "bg-green-100 text-green-700",
                                                    log.status === 'tarde' && "bg-amber-100 text-amber-700",
                                                    log.status === 'ausente' && "bg-red-100 text-red-700"
                                                )}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
