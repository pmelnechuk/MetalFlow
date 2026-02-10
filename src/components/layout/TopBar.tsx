interface TopBarProps {
    title: string
    subtitle?: string
    actions?: React.ReactNode
    children?: React.ReactNode
}

export function TopBar({ title, subtitle, actions, children }: TopBarProps) {
    return (
        <header className="bg-white border-b-[3px] border-black px-6 lg:px-8 py-4 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-black uppercase truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
            {children && (
                <div className="mt-4">
                    {children}
                </div>
            )}
        </header>
    )
}
