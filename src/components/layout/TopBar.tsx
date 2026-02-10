interface TopBarProps {
    title: string
    subtitle?: string
    actions?: React.ReactNode
    children?: React.ReactNode
}

export function TopBar({ title, subtitle, actions, children }: TopBarProps) {
    return (
        <header className="bg-white border-b border-hc-border px-6 lg:px-8 py-5 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-navy-900 uppercase truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
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
