import { z } from "zod"

// Stati progetto identici al CRM originale
export const projectStatusEnum = z.enum(["planning", "in-progress", "review", "completed", "on-hold"])

export const projectFormSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Il cliente è obbligatorio"),
  startDate: z.string().min(1, "La data di inizio è obbligatoria"),
  endDate: z.string().min(1, "La data di fine è obbligatoria"),
  status: projectStatusEnum.default("planning"),
  budget: z.coerce.number().min(0, "Il budget deve essere un numero positivo"),
  completed: z.coerce.number().min(0).max(100, "Il completamento deve essere tra 0 e 100").default(0),
  notes: z.string().optional(),
  repository: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

export const projectUpdateSchema = projectFormSchema.partial()

export type ProjectUpdateValues = z.infer<typeof projectUpdateSchema>
