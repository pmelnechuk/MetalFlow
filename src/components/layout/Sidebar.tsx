import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navItems = [
    { path: '/', icon: 'folder_open', label: 'Proyectos' },
    { path: '/tablero', icon: 'view_kanban', label: 'Tablero' },
    { path: '/voz', icon: 'mic', label: 'Grabación' },
    { path: '/ajustes', icon: 'settings', label: 'Ajustes' },
]

export function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <aside className="hidden md:flex flex-col w-[240px] lg:w-[260px] bg-white border-r-[3px] border-black h-screen sticky top-0 shrink-0">
            {/* Brand */}
            <div className="px-5 py-6 border-b-[3px] border-black">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-hc-accent rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                        <span className="material-symbols-outlined text-white text-xl icon-filled">precision_manufacturing</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-wider text-black leading-none">MetalFlow</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión de Taller</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path)
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-base uppercase tracking-wide transition-all group',
                                isActive
                                    ? 'bg-hc-accent text-white shadow-[3px_3px_0px_0px_#000000] border-[2px] border-black'
                                    : 'text-gray-500 hover:bg-hc-surface hover:text-black border-2 border-transparent'
                            )}
                        >
                            <span className={cn(
                                'material-symbols-outlined text-[22px]',
                                isActive && 'icon-filled'
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-sm">{item.label}</span>
                            {item.path === '/voz' && (
                                <div className={cn(
                                    'ml-auto w-2.5 h-2.5 rounded-full',
                                    isActive ? 'bg-white' : 'bg-red-500'
                                )} />
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t-[3px] border-black">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-hc-surface rounded-lg border-2 border-black flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-gray-500">person</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-black truncate">El Jefe</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
