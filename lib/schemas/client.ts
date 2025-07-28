import { z } from "zod"

const clientStatusEnum = z.enum(["active", "inactive"])
const clientCategoryEnum = z.enum(["standard", "premium"])

export const clientFormSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  company: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: clientCategoryEnum.default("standard"),
  status: clientStatusEnum.default("active"),
  notes: z.string().optional(),
  lastContact: z.string().optional(), // ISO string date
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const clientUpdateSchema = clientFormSchema.partial()

export type ClientUpdateValues = z.infer<typeof clientUpdateSchema>
