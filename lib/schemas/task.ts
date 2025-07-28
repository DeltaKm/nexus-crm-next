import { z } from "zod"

export const taskFormSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, "Il progetto è obbligatorio"),
  assigneeId: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const taskUpdateSchema = taskFormSchema.partial()

export type TaskUpdateValues = z.infer<typeof taskUpdateSchema>
