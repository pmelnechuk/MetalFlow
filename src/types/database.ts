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
            attendance_logs: {
                Row: {
                    id: string
                    employee_id: string
                    date: string
                    check_in: string | null
                    check_out: string | null
                    status: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    employee_id: string
                    date?: string
                    check_in?: string | null
                    check_out?: string | null
                    status: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    employee_id?: string
                    date?: string
                    check_in?: string | null
                    check_out?: string | null
                    status?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_logs_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "employees"
                        referencedColumns: ["id"]
                    }
                ]
            }
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
            suppliers: {
                Row: {
                    id: string
                    name: string
                    category: string
                    phone: string | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    category?: string
                    phone?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    phone?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            purchases: {
                Row: {
                    id: string
                    description: string
                    quantity: number
                    unit: string | null
                    supplier_id: string | null
                    project_id: string | null
                    status: Database["public"]["Enums"]["purchase_status"]
                    unit_price: number | null
                    date_purchased: string | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    description: string
                    quantity?: number
                    unit?: string | null
                    supplier_id?: string | null
                    project_id?: string | null
                    status?: Database["public"]["Enums"]["purchase_status"]
                    unit_price?: number | null
                    date_purchased?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    description?: string
                    quantity?: number
                    unit?: string | null
                    supplier_id?: string | null
                    project_id?: string | null
                    status?: Database["public"]["Enums"]["purchase_status"]
                    unit_price?: number | null
                    date_purchased?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "purchases_supplier_id_fkey"
                        columns: ["supplier_id"]
                        isOneToOne: false
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "purchases_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            task_attachments: {
                Row: {
                    id: string
                    task_id: string | null
                    filename: string
                    storage_path: string
                    mime_type: string | null
                    size_bytes: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    task_id?: string | null
                    filename: string
                    storage_path: string
                    mime_type?: string | null
                    size_bytes?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    task_id?: string | null
                    filename?: string
                    storage_path?: string
                    mime_type?: string | null
                    size_bytes?: number | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "task_attachments_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    }
                ]
            }
            entities: {
                Row: { id: string; name: string; color: string; created_at: string | null }
                Insert: { id?: string; name: string; color?: string; created_at?: string | null }
                Update: { id?: string; name?: string; color?: string; created_at?: string | null }
                Relationships: []
            }
            accounts: {
                Row: { id: string; entity_id: string; name: string; type: string; initial_balance: number; currency: string; active: boolean; created_at: string | null }
                Insert: { id?: string; entity_id: string; name: string; type: string; initial_balance?: number; currency?: string; active?: boolean; created_at?: string | null }
                Update: { id?: string; entity_id?: string; name?: string; type?: string; initial_balance?: number; currency?: string; active?: boolean; created_at?: string | null }
                Relationships: [{ foreignKeyName: "accounts_entity_id_fkey"; columns: ["entity_id"]; isOneToOne: false; referencedRelation: "entities"; referencedColumns: ["id"] }]
            }
            expense_categories: {
                Row: { id: string; name: string; color: string; icon: string }
                Insert: { id?: string; name: string; color?: string; icon?: string }
                Update: { id?: string; name?: string; color?: string; icon?: string }
                Relationships: []
            }
            inventory_items: {
                Row: { id: string; name: string; unit: string; stock_min: number; description: string | null; active: boolean; created_at: string | null }
                Insert: { id?: string; name: string; unit: string; stock_min?: number; description?: string | null; active?: boolean; created_at?: string | null }
                Update: { id?: string; name?: string; unit?: string; stock_min?: number; description?: string | null; active?: boolean; created_at?: string | null }
                Relationships: []
            }
            movements: {
                Row: { id: string; entity_id: string; account_id: string; type: string; amount: number; date: string; description: string | null; category_id: string | null; project_id: string | null; employee_id: string | null; inventory_item_id: string | null; inventory_qty: number | null; transfer_pair_id: string | null; purchase_id: string | null; created_at: string | null }
                Insert: { id?: string; entity_id: string; account_id: string; type: string; amount: number; date?: string; description?: string | null; category_id?: string | null; project_id?: string | null; employee_id?: string | null; inventory_item_id?: string | null; inventory_qty?: number | null; transfer_pair_id?: string | null; purchase_id?: string | null; created_at?: string | null }
                Update: { id?: string; entity_id?: string; account_id?: string; type?: string; amount?: number; date?: string; description?: string | null; category_id?: string | null; project_id?: string | null; employee_id?: string | null; inventory_item_id?: string | null; inventory_qty?: number | null; transfer_pair_id?: string | null; purchase_id?: string | null; created_at?: string | null }
                Relationships: [
                    { foreignKeyName: "movements_entity_id_fkey"; columns: ["entity_id"]; isOneToOne: false; referencedRelation: "entities"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "expense_categories"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_employee_id_fkey"; columns: ["employee_id"]; isOneToOne: false; referencedRelation: "employees"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_inventory_item_id_fkey"; columns: ["inventory_item_id"]; isOneToOne: false; referencedRelation: "inventory_items"; referencedColumns: ["id"] },
                    { foreignKeyName: "movements_purchase_id_fkey"; columns: ["purchase_id"]; isOneToOne: false; referencedRelation: "purchases"; referencedColumns: ["id"] }
                ]
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            project_status: "activo" | "inactivo"
            task_priority: "alta" | "media" | "baja"
            task_status: "backlog" | "por_hacer" | "en_proceso" | "terminado"
            purchase_status: "pendiente" | "comprado" | "cancelado"
        }
        CompositeTypes: Record<string, never>
    }
}

// ─── New table types (finanzas module) ───────────────────────────────────────

export type Entity = {
    id: string
    name: string
    color: string
    created_at: string | null
}

export type Account = {
    id: string
    entity_id: string
    name: string
    type: 'cash' | 'bank' | 'digital'
    initial_balance: number
    currency: string
    active: boolean
    created_at: string | null
}

export type ExpenseCategory = {
    id: string
    name: string
    color: string
    icon: string
}

export type InventoryItem = {
    id: string
    name: string
    unit: string
    stock_min: number
    description: string | null
    active: boolean
    created_at: string | null
}

export type MovementType =
    | 'gasto'
    | 'ingreso'
    | 'compra_insumo'
    | 'pago_sueldo'
    | 'consumo_insumo'
    | 'transferencia'

export type Movement = {
    id: string
    entity_id: string
    account_id: string
    type: MovementType
    amount: number
    date: string
    description: string | null
    category_id: string | null
    project_id: string | null
    employee_id: string | null
    inventory_item_id: string | null
    inventory_qty: number | null
    transfer_pair_id: string | null
    purchase_id: string | null
    created_at: string | null
    // joined relations
    account?: Account & { entity?: Entity }
    category?: ExpenseCategory | null
    project?: Pick<Project, 'id' | 'name' | 'client'> | null
    employee?: Pick<Employee, 'id' | 'first_name' | 'last_name'> | null
    inventory_item?: Pick<InventoryItem, 'id' | 'name' | 'unit'> | null
}

export type AccountWithBalance = Account & {
    entity_name: string
    entity_color: string
    balance: number
}

export type InventoryStock = InventoryItem & {
    stock_current: number
}

export type ProjectCost = Pick<Project, 'id' | 'name' | 'client' | 'status'> & {
    total_cost: number
    materials_cost: number
    labor_cost: number
    movement_count: number
}

// ─────────────────────────────────────────────────────────────────────────────

// Convenience types
export type TaskPriority = Database["public"]["Enums"]["task_priority"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]

export type Employee = Database["public"]["Tables"]["employees"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
    project?: Project | null
}
export type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
export type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"]

export type PurchaseStatus = Database["public"]["Enums"]["purchase_status"]
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"]
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"] & {
    supplier?: Supplier | null
    project?: Project | null
}
export type SupplierWithStats = Supplier & {
    total_spent: number
    purchase_count: number
    last_purchase_date: string | null
}
