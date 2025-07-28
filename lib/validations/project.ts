import { z } from "zod"

export const projectFormSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional().nullable(),
  clientId: z.string().min(1, "Il cliente è obbligatorio"),
  startDate: z.string().min(1, "La data di inizio è obbligatoria").refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Inserisci una data di inizio valida"),
  endDate: z.string().min(1, "La data di fine è obbligatoria").refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Inserisci una data di fine valida"),
  status: z.enum(["planning", "in-progress", "review", "completed", "on-hold"]),
  budget: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  completed: z.coerce.number().min(0).max(100).default(0),
  repository: z.string().optional().nullable(),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
