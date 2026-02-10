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
            className="fab-button fixed right-6 bottom-24 sm:bottom-28 z-30 h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-2xl bg-hc-accent border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center text-white"
        >
            <span className="material-symbols-outlined text-[36px] sm:text-[40px] font-bold icon-filled">{icon}</span>
        </button>
    )
}
