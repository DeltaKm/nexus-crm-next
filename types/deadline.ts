export interface DeadlinePayment {
  id: string
  description: string
  paymentType: string
  dueDate: string
  amount: number
  dueNotes?: string | null
  isPaid: boolean
  paymentDate?: string | null
  paymentNotes?: string | null
  clientId?: string | null
  projectId?: string | null
  client?: {
    id: string
    name: string
    company?: string | null
  } | null
  project?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
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
