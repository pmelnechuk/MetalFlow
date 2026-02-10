import { TopBar } from '../components/layout/TopBar'

export function SettingsPage() {
    const menuItems = [
        { icon: 'person', label: 'Perfil', desc: 'Configurar usuario y datos de la empresa', color: 'bg-blue-50 text-blue-600' },
        { icon: 'smart_toy', label: 'Inteligencia Artificial', desc: 'API Key de Gemini para reconocimiento de voz', color: 'bg-purple-50 text-purple-600' },
        { icon: 'notifications', label: 'Notificaciones', desc: 'Configurar alertas y recordatorios', color: 'bg-amber-50 text-amber-600' },
        { icon: 'database', label: 'Base de Datos', desc: 'Supabase conectado — Región: sa-east-1', color: 'bg-green-50 text-green-600', connected: true },
        { icon: 'info', label: 'Acerca de', desc: 'MetalFlow v1.0 — Gestión de Taller Industrial', color: 'bg-gray-100 text-gray-600' },
    ]

    return (
        <>
            <TopBar title="Ajustes" subtitle="Configuración de la aplicación" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                <div className="max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {menuItems.map((item, i) => (
                            <div
                                key={item.label}
                                className="stagger-item card-hover border-[2px] border-black rounded-xl p-4 bg-white card-shadow-sm cursor-pointer"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className={`w-11 h-11 rounded-xl ${item.color} border-2 border-black flex items-center justify-center shrink-0`}>
                                        <span className="material-symbols-outlined text-xl icon-filled">{item.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-black uppercase truncate">{item.label}</p>
                                            {item.connected && (
                                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-black shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-400 mt-0.5 line-clamp-2">{item.desc}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-lg text-gray-300 shrink-0 mt-1">chevron_right</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-hc-accent rounded-md border border-black flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[10px] icon-filled">precision_manufacturing</span>
                            </div>
                            <span className="text-xs font-black text-gray-300 uppercase">MetalFlow</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                            Gestión de Tareas para Taller Industrial · v1.0.0
                        </p>
                    </div>
                </div>
            </main>
        </>
    )
}
