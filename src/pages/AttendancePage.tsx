import { useState, useEffect } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendance } from '../hooks/useAttendance'
import { TopBar } from '../components/layout/TopBar'
import { cn } from '../lib/utils'

export function AttendancePage() {
    const { employees = [] } = useEmployees() // Ensure default
    const { logs = [], fetchDailyLogs, checkIn, checkOut, updateLog, getWeeklyLogs, deleteLog } = useAttendance() // Ensure default
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [editingLog, setEditingLog] = useState<any>(null)
    const [editForm, setEditForm] = useState({ check_in: '', check_out: '' })

    // Report State
    const [showReport, setShowReport] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [reportRange, setReportRange] = useState({ start: '', end: '' })

    // ... (keep handleGenerateReport as is) ...

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value)
    }

    // Effect to fetch logs when selectedDate changes
    useEffect(() => {
        fetchDailyLogs(selectedDate)
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [fetchDailyLogs, selectedDate])

    const handleGenerateReport = async () => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        const monday = new Date(today.setDate(diff)).toISOString().split('T')[0]
        const friday = new Date(today.setDate(diff + 4)).toISOString().split('T')[0]

        setReportRange({ start: monday, end: friday })
        const data = await getWeeklyLogs(monday, friday)

        // Group by employee
        const grouped: Record<string, any> = {}
        employees.forEach(emp => {
            if (emp.status === 'active') {
                grouped[emp.id] = {
                    employee: emp,
                    logs: {}
                }
            }
        })



        // Helper to calculate hours
        const calculateHours = (cin?: string, cout?: string) => {
            if (!cin || !cout) return 0
            const start = new Date(cin)
            const end = new Date(cout)

            // Define lunch period for the specific day
            const lunchStart = new Date(start)
            lunchStart.setHours(12, 0, 0, 0)
            const lunchEnd = new Date(start)
            lunchEnd.setHours(13, 0, 0, 0)

            // Gross duration in hours
            let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

            // Check overlap with lunch
            if (start < lunchEnd && end > lunchStart) {
                // Calculate overlap duration
                const overlapStart = start > lunchStart ? start : lunchStart
                const overlapEnd = end < lunchEnd ? end : lunchEnd
                const overlap = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60)

                if (overlap > 0) {
                    diff -= overlap
                }
            }

            return diff > 0 ? diff : 0
        }

        if (Array.isArray(data)) {
            data.forEach(log => {
                if (grouped[log.employee_id]) {
                    grouped[log.employee_id].logs[log.date] = log
                    // Accumulate hours
                    const hours = calculateHours(log.check_in, log.check_out)
                    grouped[log.employee_id].totalHours = (grouped[log.employee_id].totalHours || 0) + hours
                }
            })
        }

        setReportData(Object.values(grouped))
        setShowReport(true)
    }

    const openEditModal = (log: any) => {
        setEditingLog(log)

        // Helper to ensure HH:mm format for input type="time"
        const toInputTime = (isoString: string) => {
            if (!isoString) return ''
            const d = new Date(isoString)
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        }

        setEditForm({
            check_in: log.check_in ? toInputTime(log.check_in) : '',
            check_out: log.check_out ? toInputTime(log.check_out) : ''
        })
    }

    const handleUpdateLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLog) return

        try {
            const datePrefix = editingLog.date // "YYYY-MM-DD"

            // Helper to combine date + time string into ISO
            const toISO = (timeStr: string) => {
                if (!timeStr) return null
                const [hours, minutes] = timeStr.split(':')
                const d = new Date(datePrefix)
                d.setHours(parseInt(hours), parseInt(minutes))
                // Adjust for local timezone offset if needed, but for simplicity relying on local time rendering
                // Better approach: construct date object in local time then toISOString, 
                // but since we receive YYYY-MM-DD from DB which is UTC 00:00 usually, we need to be careful.
                // Simplified: use current date object, set date to log date, set time.
                const fullDate = new Date()
                const [year, month, day] = datePrefix.split('-')
                fullDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day))
                fullDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                return fullDate.toISOString()
            }

            await updateLog(editingLog.id, {
                check_in: toISO(editForm.check_in)!,
                check_out: editForm.check_out ? toISO(editForm.check_out)! : undefined
            })
            setEditingLog(null)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteLog = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este registro de asistencia?')) {
            try {
                await deleteLog(id)
            } catch (error) {
                console.error(error)
            }
        }
    }

    useEffect(() => {
        fetchDailyLogs()
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [fetchDailyLogs])

    const getEmployeeStatus = (employeeId: string) => {
        if (!Array.isArray(logs)) return 'pending'
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
        try {
            return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return '--:--'
        }
    }

    const safeTimeToken = (isoString: string | null | undefined) => {
        if (!isoString) return '-'
        try {
            const date = new Date(isoString)
            if (isNaN(date.getTime())) return '-'
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return '-'
        }
    }

    // Safeguard: if employees is not loaded yet or error
    if (!employees) return null

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar
                title="Asistencia"
                subtitle={currentTime.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerateReport}
                            className="bg-navy-900 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg shadow hover:bg-navy-800 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">print</span>
                            <span className="hidden sm:inline">Reporte Semanal</span>
                        </button>
                        <div className="text-2xl font-black text-navy-900 font-mono bg-white px-4 py-1 rounded-lg shadow-sm border border-gray-100">
                            {formatTime(currentTime)}
                        </div>
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                {/* Kiosco Grid */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-navy-900 mb-4 uppercase tracking-wide">Registro Rápido</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.isArray(employees) && employees.filter(e => e.status === 'active').map(employee => {
                            const status = getEmployeeStatus(employee.id)
                            const log = Array.isArray(logs) ? logs.find(l => l.employee_id === employee.id) : null

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
                                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                                    </div>
                                    <h3 className="font-bold text-navy-900 text-sm mb-1">{employee.first_name}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        {status === 'pending' ? 'Marcar Entrada' :
                                            status === 'working' ? 'Marcar Salida' : 'Jornada Finalizada'}
                                    </span>

                                    {status === 'working' && (
                                        <div className="mt-2 text-xs font-mono text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                            {safeTimeToken(log?.check_in)}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Daily Log Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-navy-900 uppercase">Registros del Día</h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                            {logs?.length || 0} registros
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
                                    <th className="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!logs || logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
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
                                                {safeTimeToken(log.check_in)}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-gray-600">
                                                {safeTimeToken(log.check_out)}
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
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditModal(log)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-navy-900 transition-colors"
                                                        title="Editar horario"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Eliminar registro"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Edit Log Modal */}
            {editingLog && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingLog(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-navy-900 text-lg mb-4">Editar Registro</h3>
                        <form onSubmit={handleUpdateLog} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrada</label>
                                <input
                                    type="time"
                                    required
                                    value={editForm.check_in}
                                    onChange={e => setEditForm({ ...editForm, check_in: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Salida</label>
                                <input
                                    type="time"
                                    value={editForm.check_out}
                                    onChange={e => setEditForm({ ...editForm, check_out: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingLog(null)}
                                    className="px-4 py-2 text-gray-600 font-bold text-xs uppercase hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-navy-900 text-white font-bold text-xs uppercase rounded-lg hover:bg-navy-800"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Weekly Report Modal (Print View) */}
            {showReport && (
                <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                    <div className="p-8 max-w-[210mm] mx-auto"> {/* A4 Width */}
                        <div className="flex justify-between items-start mb-8 print-hide">
                            <h2 className="text-2xl font-bold text-navy-900">Vista Previa del Reporte</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-navy-900 text-white font-bold rounded-lg hover:bg-navy-800"
                                >
                                    Imprimir / PDF
                                </button>
                                <button
                                    onClick={() => setShowReport(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        {/* Printable Content */}
                        <div className="border border-black p-4" id="printable-area">
                            <div className="text-center mb-6 border-b border-black pb-4">
                                <h1 className="text-2xl font-bold uppercase mb-1">MetalFlow - Reporte de Asistencia</h1>
                                <p className="font-mono text-sm">
                                    Semana: {reportRange.start} al {reportRange.end}
                                </p>
                            </div>

                            <table className="w-full text-xs border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <th className="border border-black p-1 bg-gray-100 w-1/4">Empleado</th>
                                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, i) => {
                                            // Calculate date for header
                                            const d = new Date(reportRange.start)
                                            d.setDate(d.getDate() + i)
                                            return (
                                                <th key={day} className="border border-black p-1 bg-gray-100 text-center">
                                                    {day} <br />
                                                    <span className="text-[9px] font-normal">{d.getDate()}/{d.getMonth() + 1}</span>
                                                </th>
                                            )
                                        })}
                                        <th className="border border-black p-1 bg-gray-100 w-16 text-center">Hs Totales</th>
                                        <th className="border border-black p-1 bg-gray-100 w-32">Firma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item: any) => (
                                        <tr key={item.employee.id}>
                                            <td className="border border-black p-2 font-bold uppercase">
                                                {item.employee.last_name}, {item.employee.first_name}
                                                <div className="text-[9px] font-normal text-gray-500">{item.employee.role}</div>
                                            </td>
                                            {Array.from({ length: 5 }).map((_, i) => {
                                                // Fix timezone issue by treating string strictly as YYYY-MM-DD
                                                const [y, m, day] = reportRange.start.split('-').map(Number)
                                                const current = new Date(y, m - 1, day + i)
                                                const dateStr = current.toISOString().split('T')[0]
                                                const log = item.logs[dateStr]

                                                return (
                                                    <td key={i} className="border border-black p-1 text-center h-12 align-middle">
                                                        {log ? (
                                                            <div className="flex flex-col text-[10px]">
                                                                <span>{log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                                                                <span className="border-t border-black/20 my-0.5"></span>
                                                                <span>{log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                            <td className="border border-black p-1 text-center font-bold">
                                                {item.totalHours ? item.totalHours.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-black p-1"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-8 flex justify-between text-xs font-bold uppercase pt-8">
                                <div className="border-t border-black w-32 pt-1 text-center">Firma Responsable</div>
                                <div className="border-t border-black w-32 pt-1 text-center">Fecha</div>
                            </div>
                        </div>

                        <style>{`
                            @media print {
                                .print-hide { display: none; }
                                body { background: white; }
                                @page { size: landscape; margin: 10mm; }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </div>
    )
}
