export type TaskPriority = 'alta' | 'media' | 'baja'
export type TaskStatus = 'backlog' | 'por_hacer' | 'en_proceso' | 'terminado'
export type ProjectStatus = 'activo' | 'inactivo'

export interface Project {
    id: string
    name: string
    client: string
    status: ProjectStatus
    created_at: string
    updated_at: string
}

export interface Task {
    id: string
    title: string
    description: string | null
    project_id: string | null
    priority: TaskPriority
    status: TaskStatus
    position: number
    due_date: string | null
    progress: number
    created_at: string
    updated_at: string
    // Joined
    project?: Project
}

export interface Database {
    public: {
        Tables: {
            projects: {
                Row: Project
                Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
            }
            tasks: {
                Row: Task
                Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project'>
                Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project'>>
            }
        }
        Enums: {
            task_priority: TaskPriority
            task_status: TaskStatus
            project_status: ProjectStatus
        }
    }
}
