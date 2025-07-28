import * as z from "zod"

// Schema per la validazione di un elemento della fattura
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  quantity: z.coerce.number().min(0.01, "La quantità deve essere maggiore di 0"),
  unitPrice: z.coerce.number().min(0, "Il prezzo unitario non può essere negativo"),
  taxRate: z.coerce.number().min(0, "L'aliquota IVA non può essere negativa").default(0),
  timeEntryId: z.string().optional().nullable(),
})

// Schema per la validazione della fattura
export const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().min(1, "Il numero di fattura è obbligatorio"),
  issueDate: z.coerce.date().min(new Date("1900-01-01"), "La data di emissione è obbligatoria"),
  dueDate: z.coerce.date().min(new Date("1900-01-01"), "La data di scadenza è obbligatoria"),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  taxRate: z.coerce.number().min(0, "L'aliquota IVA non può essere negativa").default(0),
  notes: z.string().optional().nullable(),
  clientId: z.string().min(1, "Il cliente è obbligatorio"),
  projectId: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "Almeno un elemento è obbligatorio"),
})

// Schema per il form di creazione/modifica fattura
export const invoiceFormSchema = invoiceSchema.omit({ 
  id: true,
  items: true 
})

// Schema per il form di creazione/modifica elemento fattura
export const invoiceItemFormSchema = invoiceItemSchema.omit({ 
  id: true,
  invoiceId: true,
})

// Tipo derivato dallo schema
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>
export type InvoiceItemFormValues = z.infer<typeof invoiceItemFormSchema>
