import * as z from "zod"

// Schema per la validazione di un elemento della fattura
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string()
    .min(1, "La descrizione è obbligatoria")
    .max(255, "La descrizione non può superare i 255 caratteri"),
  
  quantity: z.coerce.number()
    .min(0.01, "La quantità deve essere maggiore di 0")
    .max(999999.99, "La quantità massima consentita è 999.999,99"),
  
  unitPrice: z.coerce.number()
    .min(0, "Il prezzo unitario non può essere negativo")
    .max(9999999.99, "Il prezzo massimo consentito è 9.999.999,99 €")
    .transform(val => parseFloat(val.toFixed(2))),
  
  taxRate: z.coerce.number()
    .min(0, "L'aliquota IVA non può essere negativa")
    .max(100, "L'aliquota IVA massima consentita è 100%")
    .default(22)
    .transform(val => parseFloat(val.toFixed(2))),
  
  timeEntryId: z.string().optional().nullable()
})

// Schema base per la validazione della fattura
const baseInvoiceSchema = z.object({
  id: z.string().optional(),
  
  invoiceNumber: z.string()
    .min(1, "Il numero di fattura è obbligatorio")
    .max(50, "Il numero di fattura non può superare i 50 caratteri"),
  
  issueDate: z.coerce.date()
    .min(new Date("2000-01-01"), "La data deve essere successiva al 01/01/2000")
    .refine(date => !isNaN(date.getTime()), "Data di emissione non valida"),
  
  dueDate: z.coerce.date()
    .min(new Date("2000-01-01"), "La data deve essere successiva al 01/01/2000")
    .refine(date => !isNaN(date.getTime()), "Data di scadenza non valida"),
  
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"])
    .default("DRAFT"),
  
  taxRate: z.coerce.number()
    .min(0, "L'aliquota IVA non può essere negativa")
    .max(100, "L'aliquota IVA massima consentita è 100%")
    .default(22)
    .transform(val => parseFloat(val.toFixed(2))),
  
  notes: z.string()
    .max(1000, "Le note non possono superare i 1000 caratteri")
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
    
  clientId: z.string()
    .min(1, "Il cliente è obbligatorio"),
  
  projectId: z.string().nullable().optional(),
  
  items: z.array(invoiceItemSchema)
    .min(1, "Aggiungi almeno una riga alla fattura")
    .refine(
      (items) => items.every(item => 
        item.description?.trim() && 
        item.quantity > 0 && 
        item.unitPrice >= 0
      ),
      { 
        message: "Tutte le righe devono avere una descrizione, quantità e prezzo validi" 
      }
    )
})

// Aggiungi la validazione incrociata per le date
export const invoiceSchema = baseInvoiceSchema.refine(
  (data) => !data.issueDate || !data.dueDate || data.dueDate >= data.issueDate,
  {
    message: "La data di scadenza non può essere precedente alla data di emissione",
    path: ["dueDate"]
  }
)

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

// Invoice status type
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"

// Export the form type with items
export type InvoiceFormWithItems = z.infer<typeof invoiceSchema>

// Tipo derivato dallo schema
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>
export type InvoiceItemFormValues = z.infer<typeof invoiceItemFormSchema>
