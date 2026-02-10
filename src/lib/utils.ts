export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string | null): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`
}

export function getPriorityLabel(priority: string): string {
    switch (priority) {
        case 'alta': return 'URGENTE'
        case 'media': return 'NORMAL'
        case 'baja': return 'BAJA'
        default: return priority.toUpperCase()
    }
}

export function getPriorityStyles(priority: string): string {
    switch (priority) {
        case 'alta':
            return 'bg-red-100 text-red-900 border-2 border-black'
        case 'media':
            return 'bg-gray-200 text-black border-2 border-black'
        case 'baja':
            return 'bg-green-100 text-green-900 border-2 border-black'
        default:
            return 'bg-gray-200 text-black border-2 border-black'
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'backlog': return 'Pendientes'
        case 'por_hacer': return 'Hoy'
        case 'en_proceso': return 'En Curso'
        case 'terminado': return 'Listo'
        default: return status
    }
}

export function getStatusIcon(status: string): string {
    switch (status) {
        case 'backlog': return 'pending_actions'
        case 'por_hacer': return 'today'
        case 'en_proceso': return 'construction'
        case 'terminado': return 'check_circle'
        default: return 'help'
    }
}
