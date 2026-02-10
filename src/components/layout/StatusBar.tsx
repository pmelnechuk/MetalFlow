export function StatusBar() {
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    return (
        <div className="h-12 w-full flex items-center justify-between px-6 pt-2 z-20 bg-hc-bg sticky top-0 border-b-2 border-hc-divider">
            <span className="text-lg font-bold text-black">{timeStr}</span>
            <div className="flex gap-3 text-black">
                <span className="material-symbols-outlined text-xl">signal_cellular_alt</span>
                <span className="material-symbols-outlined text-xl">wifi</span>
                <span className="material-symbols-outlined text-xl">battery_full</span>
            </div>
        </div>
    )
}
