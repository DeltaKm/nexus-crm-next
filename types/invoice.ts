import { z } from "zod"
import { invoiceItemSchema, invoiceSchema } from "@/lib/validations/invoice"

export type InvoiceItem = z.infer<typeof invoiceItemSchema> & {
  id: string
  amount: number
  timeEntryId: string | null
  createdAt: Date
  updatedAt: Date
  invoiceId: string
}

export type Invoice = z.infer<typeof invoiceSchema>

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface InvoiceFormData {
  invoiceNumber: string
  clientId: string
  projectId?: string | null
  issueDate: Date | string
  dueDate: Date | string
  status: InvoiceStatus
  taxRate: number
  notes?: string | null
  items: Array<{
    description: string
    quantity: number | string
    unitPrice: number | string
    taxRate: number | string
  }>
}

export interface Client {
  id: string
  name: string
  company?: string | null
}

export interface Project {
  id: string
  name: string
}
