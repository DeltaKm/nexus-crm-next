"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import AddClientDialog from "@/components/clients/AddClientDialog"
import ClientDetailsDialog from "@/components/clients/ClientDetailsDialog"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import EditClientDialog from "@/components/clients/EditClientDialog"

interface Client {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  category: string
  status: string
  notes?: string | null
  lastContact?: string | null
  createdAt: string
  updatedAt?: string
  creator: {
    id: string
    name: string
    email: string
  }
  _count?: {
    projects: number
    invoices: number
  }
}

async function fetchClients(search?: string, status?: string): Promise<Client[]> {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  if (status && status !== "all") params.append("status", status)
  
  const response = await fetch(`/api/clients?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error("Errore nel caricamento dei clienti")
  }
  
  return response.json()
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const { data: clients = [], isLoading, error, refetch } = useQuery({
    queryKey: ["clients", searchTerm, statusFilter],
    queryFn: () => fetchClients(searchTerm, statusFilter),
    enabled: !!session,
  })

  React.useEffect(() => {
    if (error) {
      toast.error("Errore nel caricamento dei clienti")
    }
  }, [error])

  // Handlers per i dialog
  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setSelectedClient(null)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedClient(null)
  }

  const handleClientUpdate = () => {
    refetch()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Clienti</h1>
        <Button 
          className="flex items-center space-x-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Cliente</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca clienti per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Tutti gli stati</option>
              <option value="ACTIVE">Attivi</option>
              <option value="INACTIVE">Inattivi</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento clienti...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && clients.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun cliente trovato
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "Prova a modificare i filtri di ricerca"
                  : "Inizia aggiungendo il tuo primo cliente"
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Cliente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        {!isLoading && clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleClientClick(client)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {client.status === "active" ? "Attivo" : "Inattivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {client.phone}
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {client.address}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center text-sm text-gray-500">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {client._count?.projects || 0} progetti
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="w-4 h-4 mr-1" />
                        {client._count?.invoices || 0} fatture
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Dialog */}
      <AddClientDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        client={selectedClient}
        isOpen={isDetailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        onClientUpdate={handleClientUpdate}
        onEditClient={handleEditClient}
      />

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={selectedClient}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onClientUpdate={handleClientUpdate}
      />
    </DashboardLayout>
  )
}
