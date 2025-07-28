"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Search } from "lucide-react"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog"
import { InvoiceDetailsDialog } from "@/components/invoices/InvoiceDetailsDialog"

interface Client {
  id: string
  name: string
  company?: string | null
}

interface Project {
  id: string
  name: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  taxRate: number
  notes?: string | null
  clientId: string
  projectId?: string | null
  client: {
    id: string
    name: string
    company?: string | null
  }
  project?: {
    id: string
    name: string
  } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
  }>
  sender: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  
  // Filtri
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [clientFilter, setClientFilter] = useState(searchParams.get("clientId") || "")
  const [projectFilter, setProjectFilter] = useState(searchParams.get("projectId") || "")
  const [searchFilter, setSearchFilter] = useState(searchParams.get("search") || "")

  // Carica i dati delle fatture
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      // Costruisci i parametri di query
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (clientFilter) params.append("clientId", clientFilter)
      if (projectFilter) params.append("projectId", projectFilter)
      if (searchFilter) params.append("search", searchFilter)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle fatture")
      }
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error("Errore nel caricamento delle fatture:", error)
    } finally {
      setLoading(false)
    }
  }

  // Carica i clienti per il filtro
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei clienti")
      }
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Errore nel caricamento dei clienti:", error)
    }
  }

  // Carica i progetti per il filtro
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei progetti")
      }
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Errore nel caricamento dei progetti:", error)
    }
  }

  // Carica i dati all'avvio
  useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchProjects()
  }, [])

  // Aggiorna i dati quando cambiano i filtri
  useEffect(() => {
    fetchInvoices()
    
    // Aggiorna l'URL con i parametri di filtro
    const params = new URLSearchParams()
    if (statusFilter) params.append("status", statusFilter)
    if (clientFilter) params.append("clientId", clientFilter)
    if (projectFilter) params.append("projectId", projectFilter)
    if (searchFilter) params.append("search", searchFilter)
    
    const url = `/invoices${params.toString() ? `?${params.toString()}` : ""}`
    router.push(url, { scroll: false })
  }, [statusFilter, clientFilter, projectFilter, searchFilter])

  // Funzione per ottenere il badge dello stato
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Bozza</Badge>
      case "SENT":
        return <Badge variant="secondary">Inviata</Badge>
      case "PAID":
        return <Badge variant="success">Pagata</Badge>
      case "OVERDUE":
        return <Badge variant="destructive">Scaduta</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Annullata</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calcola il totale di una fattura
  const calculateInvoiceTotal = (invoice: Invoice) => {
    return invoice.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice
      const tax = itemTotal * (item.taxRate / 100)
      return total + itemTotal + tax
    }, 0)
  }

  // Gestisce il click su una riga della tabella
  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fatture</h1>
          <AddInvoiceDialog
            clients={clients}
            projects={projects}
            onInvoiceCreated={fetchInvoices}
          />
        </div>

        {/* Filtri */}
        <Card>
          <CardHeader>
            <CardTitle>Filtri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti gli stati</SelectItem>
                  <SelectItem value="DRAFT">Bozza</SelectItem>
                  <SelectItem value="SENT">Inviata</SelectItem>
                  <SelectItem value="PAID">Pagata</SelectItem>
                  <SelectItem value="OVERDUE">Scaduta</SelectItem>
                  <SelectItem value="CANCELLED">Annullata</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={clientFilter}
                onValueChange={setClientFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i clienti</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={projectFilter}
                onValueChange={setProjectFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Progetto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i progetti</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabella Fatture */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Fatture</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Caricamento fatture...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna fattura trovata
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data Emissione</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Totale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(invoice)}
                      >
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.client.name} {invoice.client.company && `(${invoice.client.company})`}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          €{calculateInvoiceTotal(invoice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Dettagli Fattura */}
      {selectedInvoice && (
        <InvoiceDetailsDialog
          invoice={selectedInvoice}
          clients={clients}
          projects={projects}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onInvoiceDeleted={fetchInvoices}
          onInvoiceUpdated={fetchInvoices}
        />
      )}
    </DashboardLayout>
  )
}
