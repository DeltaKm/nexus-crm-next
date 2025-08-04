// Tipi centralizzati per TimeEntry
export interface TimeEntry {
  id: string
  description: string
  startTime: Date
  endTime: Date | null
  billable: boolean
  rate: number | null
  createdAt: Date
  updatedAt: Date
  taskId: string
  userId: string
  projectId: string
}

// TimeEntry con relazioni complete
export interface TimeEntryWithRelations extends TimeEntry {
  project: {
    id: string
    name: string
    client?: {
      id: string
      name: string
      company?: string | null
    } | null
  }
  task: {
    id: string
    title: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  duration: number // in minuti
  isRunning: boolean
}

// Tipo per il timer attivo
export interface ActiveTimer extends TimeEntryWithRelations {
  isRunning: true
  endTime: null
}

// Tipo per la risposta API con paginazione
export interface TimeEntriesResponse {
  timeEntries: TimeEntryWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipo per statistiche tempo
export interface TimeStats {
  totalMinutes: number
  totalHours: number
  billableMinutes: number
  billableHours: number
  nonBillableMinutes: number
  nonBillableHours: number
  entriesCount: number
}

// Tipo per statistiche per progetto
export interface ProjectTimeStats extends TimeStats {
  projectId: string
  projectName: string
  clientName?: string
}

// Tipo per filtri TimeEntry
export interface TimeEntryFilters {
  projectId?: string
  taskId?: string
  startDate?: string
  endDate?: string
  billable?: boolean
  page?: number
  limit?: number
}

// Enum per i periodi di tempo
export enum TimePeriod {
  TODAY = "today",
  WEEK = "week", 
  MONTH = "month",
  YEAR = "year",
  CUSTOM = "custom"
}

// Tipo per il form di creazione/modifica
export interface TimeEntryFormData {
  description: string
  startTime: Date
  endTime?: Date | null | undefined
  billable: boolean
  rate?: number | null | undefined
  taskId: string
  projectId: string
}

// Tipo per il timer form (senza endTime)
export interface TimerFormData {
  description: string
  startTime: Date
  billable: boolean
  rate?: number | null
  taskId: string
  projectId: string
}
