"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog"
import { EditInvoiceDialog } from "@/components/invoices/EditInvoiceDialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
import type { Client } from "@/types/client"
import type { Project } from "@/types/project"

// Types
type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  amount: number;
  items: InvoiceItem[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function InvoicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Normalize client data to ensure it matches the Client type
  const normalizeClient = (clientData: any): Client => ({
    id: clientData.id,
    name: clientData.name,
    email: clientData.email || null,
    phone: clientData.phone || null,
    address: clientData.address || null,
    company: clientData.company || null,
    taxId: clientData.taxId || null,
    vatNumber: clientData.vatNumber || null,
    sdiCode: clientData.sdiCode || null,
    pec: clientData.pec || null,
    notes: clientData.notes || null,
    status: (clientData.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
    createdAt: clientData.createdAt ? new Date(clientData.createdAt) : new Date(),
    updatedAt: clientData.updatedAt ? new Date(clientData.updatedAt) : new Date(),
    userId: clientData.userId || ''
  })

  // Fetch data
  // Helper functions
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'Bozza'
      case 'sent': return 'Inviata'
      case 'paid': return 'Pagata'
      case 'overdue': return 'Scaduta'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : clientId
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsEditDialogOpen(true)
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della fattura')
      }

      // Rimuovi la fattura dalla lista locale
      setInvoices(prev => prev.filter(invoice => invoice.id !== selectedInvoice.id))
      
      toast.success(`Fattura ${selectedInvoice.invoiceNumber} eliminata con successo`)
      setIsDeleteDialogOpen(false)
      setSelectedInvoice(null)
    } catch (error) {
      console.error('Errore eliminazione fattura:', error)
      toast.error('Errore durante l\'eliminazione della fattura')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch data function
  const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch invoices
        const params = new URLSearchParams()
        if (statusFilter) params.append('status', statusFilter)
        
        const [invoicesRes, clientsRes] = await Promise.all([
          fetch(`/api/invoices?${params.toString()}`),
          fetch('/api/clients')
        ])

        if (!invoicesRes.ok) throw new Error("Error loading invoices")
        if (!clientsRes.ok) throw new Error("Error loading clients")

        const [invoicesData, clientsData] = await Promise.all([
          invoicesRes.json(),
          clientsRes.json()
        ])

        setInvoices(invoicesData)
        // Normalize clients data to ensure it matches the Client type
        const normalizedClients = Array.isArray(clientsData) 
          ? clientsData.map(normalizeClient)
          : []
        setClients(normalizedClients)
        // TODO: Fetch and normalize projects if needed
        setProjects([])
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
  }

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [statusFilter])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Fatture</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Fattura
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Fatture recenti</CardTitle>
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Tutti gli stati</option>
              <option value="draft">Bozza</option>
              <option value="sent">Inviata</option>
              <option value="paid">Pagata</option>
              <option value="overdue">Scaduta</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna fattura disponibile.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Emissione</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{getClientName(invoice.clientId)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(invoice.status)}>
                        {getStatusTranslation(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          Modifica
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <AddInvoiceDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        clients={clients}
        projects={projects}
        onInvoiceCreated={() => {
          fetchData()
        }}
      />

      {/* Edit Invoice Dialog */}
      {selectedInvoice && (
        <EditInvoiceDialog 
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setSelectedInvoice(null)
          }}
          invoice={{
            ...selectedInvoice,
            status: selectedInvoice.status.toUpperCase() as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
            taxRate: 22 // Default tax rate, should come from invoice data
          }}
          clients={clients}
          projects={projects}
          onInvoiceUpdated={() => {
            fetchData()
            setIsEditDialogOpen(false)
            setSelectedInvoice(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedInvoice(null)
        }}
        onConfirm={confirmDeleteInvoice}
        title="Elimina Fattura"
        description={`Sei sicuro di voler eliminare la fattura ${selectedInvoice?.invoiceNumber}? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        isSubmitting={isDeleting}
      />
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <InvoicesContent />
      </Suspense>
    </DashboardLayout>
  )
}
