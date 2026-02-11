import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navItems = [
    { path: '/', icon: 'folder_open', label: 'Proyectos' },
    { path: '/tablero', icon: 'view_kanban', label: 'Tablero' },
    { path: '/empleados', icon: 'groups', label: 'Personal' },
    { path: '/ajustes', icon: 'settings', label: 'Ajustes' },
]

export function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <aside className="hidden md:flex flex-col w-[240px] lg:w-[260px] bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 shadow-xl z-20">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-white text-xl icon-filled">precision_manufacturing</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold uppercase tracking-tight text-navy-900 leading-none">MetalFlow</h1>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">Gestión de Taller</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path)
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all group relative my-1',
                                isActive
                                    ? 'text-navy-900 bg-blue-50 font-bold shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-navy-900 hover:shadow-sm'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-2 bottom-2 w-[4px] bg-navy-900 rounded-r-full" />
                            )}
                            <span className={cn(
                                'material-symbols-outlined text-[24px] transition-transform group-hover:scale-110',
                                isActive && 'icon-filled text-navy-900'
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-sm uppercase tracking-wide">{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm text-navy-700">
                        <span className="material-symbols-outlined text-lg">person</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy-900 truncate">El Jefe</p>
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
