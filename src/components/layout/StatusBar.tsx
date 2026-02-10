export function StatusBar() {
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    return (
        <div className="h-8 w-full flex items-center justify-between px-6 z-50 bg-white/90 backdrop-blur-sm sticky top-0 border-b border-gray-100/50">
            <span className="text-xs font-bold text-gray-900">{timeStr}</span>
            <div className="flex gap-2 text-gray-900">
                <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                <span className="material-symbols-outlined text-sm">wifi</span>
                <span className="material-symbols-outlined text-sm">battery_full</span>
            </div>
        </div>
    )
}
