import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
    const location = useLocation()
    const isVoicePage = location.pathname.startsWith('/voz')

    return (
        <div className="bg-hc-surface text-hc-text font-display min-h-screen flex">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <Outlet />
            </div>

            {/* Mobile bottom nav (hidden on md+) */}
            {!isVoicePage && <BottomNav />}
        </div>
    )
}
