import { z } from "zod"

export const timeEntryFormSchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  startTime: z.string().min(1, "L'ora di inizio è obbligatoria"),
  endTime: z.string().optional(),
  billable: z.boolean().default(true),
  rate: z.coerce.number().min(0, "La tariffa deve essere un numero positivo").optional(),
  taskId: z.string().min(1, "Il task è obbligatorio"),
  projectId: z.string().min(1, "Il progetto è obbligatorio"),
})

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>

export const timeEntryUpdateSchema = timeEntryFormSchema.partial()

export type TimeEntryUpdateValues = z.infer<typeof timeEntryUpdateSchema>
