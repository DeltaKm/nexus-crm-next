export interface Project {
  id: string
  name: string
  description?: string | null
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  startDate?: Date | null
  endDate?: Date | null
  budget?: number | null
  hourlyRate?: number | null
  clientId: string  // Required for client-project relationship
  client?: {
    id: string
    name: string
    company?: string | null
  } | null
  userId: string
  createdAt: Date
  updatedAt: Date
}
