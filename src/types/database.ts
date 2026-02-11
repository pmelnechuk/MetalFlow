export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            employees: {
                Row: {
                    id: string
                    first_name: string
                    last_name: string
                    role: string
                    status: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    first_name: string
                    last_name: string
                    role: string
                    status?: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    first_name?: string
                    last_name?: string
                    role?: string
                    status?: string
                    created_at?: string | null
                }
                Relationships: []
            }
            project_employees: {
                Row: {
                    project_id: string
                    employee_id: string
                    created_at: string | null
                }
                Insert: {
                    project_id: string
                    employee_id: string
                    created_at?: string | null
                }
                Update: {
                    project_id?: string
                    employee_id?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "project_employees_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_employees_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "employees"
                        referencedColumns: ["id"]
                    }
                ]
            }
            projects: {
                Row: {
                    client: string
                    created_at: string | null
                    id: string
                    name: string
                    status: Database["public"]["Enums"]["project_status"] | null
                    updated_at: string | null
                }
                Insert: {
                    client: string
                    created_at?: string | null
                    id?: string
                    name: string
                    status?: Database["public"]["Enums"]["project_status"] | null
                    updated_at?: string | null
                }
                Update: {
                    client?: string
                    created_at?: string | null
                    id?: string
                    name?: string
                    status?: Database["public"]["Enums"]["project_status"] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    assigned_to: string[] | null
                    created_at: string | null
                    description: string | null
                    due_date: string | null
                    id: string
                    position: number | null
                    priority: Database["public"]["Enums"]["task_priority"] | null
                    progress: number | null
                    project_id: string | null
                    status: Database["public"]["Enums"]["task_status"] | null
                    status_changed_at: string | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    assigned_to?: string[] | null
                    created_at?: string | null
                    description?: string | null
                    due_date?: string | null
                    id?: string
                    position?: number | null
                    priority?: Database["public"]["Enums"]["task_priority"] | null
                    progress?: number | null
                    project_id?: string | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    assigned_to?: string[] | null
                    created_at?: string | null
                    description?: string | null
                    due_date?: string | null
                    id?: string
                    position?: number | null
                    priority?: Database["public"]["Enums"]["task_priority"] | null
                    progress?: number | null
                    project_id?: string | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            project_status: "activo" | "inactivo"
            task_priority: "alta" | "media" | "baja"
            task_status: "backlog" | "por_hacer" | "en_proceso" | "terminado"
        }
        CompositeTypes: Record<string, never>
    }
}

// Convenience types
export type TaskPriority = Database["public"]["Enums"]["task_priority"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]

export type Employee = Database["public"]["Tables"]["employees"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
    project?: Project | null
}
