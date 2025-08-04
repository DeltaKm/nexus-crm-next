// Tipi centralizzati per Task
export interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  projectId: string
  assigneeId: string | null
}

// Task con relazioni complete
export interface TaskWithRelations extends Task {
  project: {
    id: string
    name: string
    client?: {
      id: string
      name: string
      company?: string | null
    } | null
  }
  assignee?: {
    id: string
    name: string | null
    email: string
  } | null
}

// Tipo per il form di creazione/modifica
export interface TaskFormData {
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  projectId: string
  assigneeId?: string | null
}

// Enum per gli stati dei task
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress", 
  REVIEW = "review",
  DONE = "done"
}

// Enum per le priorità dei task
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}
