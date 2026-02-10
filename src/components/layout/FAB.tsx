interface FABProps {
    icon: string
    label: string
    onClick: () => void
}

export function FAB({ icon, label, onClick }: FABProps) {
    return (
        <button
            aria-label={label}
            onClick={onClick}
            className="fab-button fixed right-6 bottom-24 sm:bottom-28 z-30 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-navy-900 shadow-lg flex items-center justify-center text-white hover:bg-navy-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
            <span className="material-symbols-outlined text-[28px] sm:text-[32px] icon-filled">{icon}</span>
        </button>
    )
}
