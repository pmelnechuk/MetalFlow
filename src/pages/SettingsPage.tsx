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
        <div className="flex flex-col h-screen bg-slate-50">
            <TopBar title="Ajustes" subtitle="Configuración de la aplicación" />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                <div className="max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 gap-3">
                        {menuItems.map((item, i) => (
                            <div
                                key={item.label}
                                className="group bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                                    <span className="material-symbols-outlined text-2xl icon-filled">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wide truncate">{item.label}</h3>
                                        {item.connected && (
                                            <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Conectado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">{item.desc}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 group-hover:text-navy-900 transition-colors">chevron_right</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-navy-900 rounded-md flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-white text-[14px]">precision_manufacturing</span>
                            </div>
                            <span className="text-sm font-black text-navy-900 uppercase tracking-widest">MetalFlow</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Gestión de Tareas para Taller Industrial · v1.0.0
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
