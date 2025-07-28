import { z } from "zod"

export const taskFormSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().min(1, "Il progetto è obbligatorio"),
  assigneeId: z.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
