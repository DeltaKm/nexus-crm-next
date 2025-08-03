export interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  taxId?: string | null
  vatNumber?: string | null
  sdiCode?: string | null
  pec?: string | null
  notes?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date
  updatedAt: Date
  userId: string
}
