import * as z from "zod"

// Schema per la creazione/modifica di un TimeEntry
export const timeEntrySchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  startTime: z.date({
    message: "L'orario di inizio è obbligatorio",
  }),
  endTime: z.date().optional().nullable(),
  billable: z.boolean().default(true),
  rate: z.number().min(0, "La tariffa deve essere positiva").optional().nullable(),
  taskId: z.string().min(1, "Il task è obbligatorio"),
  projectId: z.string().min(1, "Il progetto è obbligatorio"),
})

// Schema per l'aggiornamento (tutti i campi opzionali tranne ID)
export const updateTimeEntrySchema = timeEntrySchema.partial()

// Schema per il timer (senza endTime)
export const startTimerSchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  startTime: z.date({
    message: "L'orario di inizio è obbligatorio",
  }),
  billable: z.boolean().default(true),
  rate: z.number().min(0, "La tariffa deve essere positiva").optional().nullable(),
  taskId: z.string().min(1, "Il task è obbligatorio"),
  projectId: z.string().min(1, "Il progetto è obbligatorio"),
})

// Schema per fermare il timer
export const stopTimerSchema = z.object({
  endTime: z.date({
    message: "L'orario di fine è obbligatorio",
  }),
})

// Tipi TypeScript derivati
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>
export type UpdateTimeEntryData = z.infer<typeof updateTimeEntrySchema>
export type StartTimerData = z.infer<typeof startTimerSchema>
export type StopTimerData = z.infer<typeof stopTimerSchema>

// Enum per lo stato del timer
export enum TimerStatus {
  STOPPED = "STOPPED",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED"
}

// Tipo per TimeEntry completo con relazioni
export interface TimeEntryWithRelations {
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
  project: {
    id: string
    name: string
    client?: {
      id: string
      name: string
      company?: string
    }
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
}
