import { UseFormReturn } from "react-hook-form"

// Base types for form values
export interface InvoiceItemFormValues {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  timeEntryId?: string | null
}

export interface InvoiceFormValues {
  id?: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  taxRate: number
  notes?: string | null
  clientId: string
  projectId?: string | null
  items: InvoiceItemFormValues[]
}

// Extended form values that include items array
export interface InvoiceFormWithItems extends Omit<InvoiceFormValues, 'items'> {
  items: InvoiceItemFormValues[]
}

// Form type for useForm hook
export type InvoiceFormType = UseFormReturn<InvoiceFormWithItems>

// Client and Project types
export interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface Project {
  id: string
  name: string
  clientId: string
  description?: string | null
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
}
