import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

const tabs = [
    { path: '/', icon: 'folder_open', label: 'Proyectos' },
    { path: '/tablero', icon: 'view_kanban', label: 'Tablero' },
    { path: '/voz', icon: 'mic', label: 'Voz' },
    { path: '/ajustes', icon: 'settings', label: 'Ajustes' },
]

export function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-black">
            <div className="flex justify-around items-center h-16">
                {tabs.map((tab) => {
                    const isActive = tab.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(tab.path)
                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative',
                                isActive ? 'text-hc-accent' : 'text-gray-400 hover:text-hc-accent'
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-hc-accent rounded-b-full" />
                            )}
                            <span className={cn(
                                'material-symbols-outlined text-[26px] mb-0.5',
                                isActive && 'icon-filled'
                            )}>
                                {tab.icon}
                            </span>
                            <span className={cn(
                                'text-[10px] uppercase tracking-wider',
                                isActive ? 'font-black' : 'font-semibold'
                            )}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </nav>
    )
}
