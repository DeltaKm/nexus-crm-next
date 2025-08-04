"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  Users, 
  Briefcase,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddEventDialog } from "@/components/calendar/AddEventDialog"
import { EditDeadlineDialog } from "@/components/deadlines/EditDeadlineDialog"
import ConfirmDialog from "@/components/deadlines/ConfirmDialog"
import type { DeadlinePayment } from "@/types/deadline"

export default function DeadlinesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlinePayment | null>(null)
  const queryClient = useQueryClient()

  // Fetch deadlines
  const { data: deadlines = [], isLoading } = useQuery<DeadlinePayment[]>({
    queryKey: ["deadlines"],
    queryFn: async () => {
      const response = await fetch("/api/deadlines")
      if (!response.ok) throw new Error("Failed to fetch deadlines")
      return response.json()
    },
  })

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      return response.json()
    },
  })

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      return response.json()
    },
  })

  // Update deadline mutation (for marking as paid)
  const updateDeadlineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DeadlinePayment> }) => {
      const response = await fetch(`/api/deadlines/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante l'aggiornamento della scadenza")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Scadenza aggiornata con successo")
      queryClient.invalidateQueries({ queryKey: ["deadlines"] })
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento della scadenza")
    },
  })

  // Delete deadline mutation
  const deleteDeadlineMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/deadlines/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante l'eliminazione della scadenza")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Scadenza eliminata con successo")
      queryClient.invalidateQueries({ queryKey: ["deadlines"] })
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'eliminazione della scadenza")
    },
  })

  // Get unique payment types for filter
  const paymentTypes = Array.from(
    new Set(deadlines.filter(d => d.paymentType).map(d => d.paymentType))
  )

  // Filter deadlines
  const filteredDeadlines = deadlines.filter((deadline) => {
    const matchesSearch = !searchTerm || 
      deadline.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deadline.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deadline.client?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deadline.project?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPaymentStatus = paymentStatusFilter === "all" ||
      (paymentStatusFilter === "paid" && deadline.isPaid) ||
      (paymentStatusFilter === "unpaid" && !deadline.isPaid)

    const matchesPaymentType = paymentTypeFilter === "all" ||
      deadline.paymentType === paymentTypeFilter

    return matchesSearch && matchesPaymentStatus && matchesPaymentType
  })

  const handlePaidStatusChange = (deadline: DeadlinePayment, isPaid: boolean) => {
    updateDeadlineMutation.mutate({
      id: deadline.id,
      updates: {
        isPaid,
        paymentDate: isPaid ? new Date().toISOString() : undefined,
      },
    })
  }

  const handleEditDeadline = (deadline: DeadlinePayment) => {
    setSelectedDeadline(deadline)
    setIsEditDialogOpen(true)
  }

  const handleDeleteDeadline = (deadline: DeadlinePayment) => {
    setSelectedDeadline(deadline)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteDeadline = () => {
    if (selectedDeadline) {
      deleteDeadlineMutation.mutate(selectedDeadline.id)
      setIsDeleteDialogOpen(false)
      setSelectedDeadline(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scadenziario</h1>
            <p className="text-gray-600">
              Gestisci tutte le scadenze di pagamento
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Scadenza
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cerca scadenze..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="paid">Pagato</SelectItem>
                  <SelectItem value="unpaid">Non pagato</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type} value={type!}>
                      {type === "invoice" ? "Fattura" :
                       type === "advance" ? "Anticipo" :
                       type === "balance" ? "Saldo" :
                       type === "other" ? "Altro" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {filteredDeadlines.length} scadenze
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Scadenze</CardTitle>
            <CardDescription>
              Gestisci tutte le scadenze di pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Caricamento scadenze in corso...</p>
              </div>
            ) : filteredDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna scadenza trovata</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || paymentStatusFilter !== "all" || paymentTypeFilter !== "all"
                    ? "Nessuna scadenza corrisponde ai filtri selezionati."
                    : "Non ci sono scadenze da visualizzare."}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi prima scadenza
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pagato</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Progetto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeadlines.map((deadline) => (
                      <TableRow key={deadline.id}>
                        <TableCell>
                          <Checkbox
                            checked={deadline.isPaid || false}
                            onCheckedChange={(checked) => 
                              handlePaidStatusChange(deadline, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className={`font-medium ${isOverdue(deadline.dueDate) && !deadline.isPaid ? 'text-red-600' : ''}`}>
                                {format(new Date(deadline.dueDate), "dd/MM/yyyy", { locale: it })}
                              </div>
                              {isOverdue(deadline.dueDate) && !deadline.isPaid && (
                                <div className="text-xs text-red-500">In ritardo</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{deadline.description || "Nessuna descrizione"}</div>
                            {deadline.dueNotes && (
                              <div className="text-sm text-gray-500">{deadline.dueNotes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deadline.client ? (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{deadline.client.name}</div>
                                {deadline.client.company && (
                                  <div className="text-sm text-gray-500">{deadline.client.company}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Nessun cliente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {deadline.project ? (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{deadline.project.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Nessun progetto</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {deadline.paymentType ? (
                            <Badge variant="outline">
                              {deadline.paymentType === "invoice" ? "Fattura" :
                               deadline.paymentType === "advance" ? "Anticipo" :
                               deadline.paymentType === "balance" ? "Saldo" :
                               deadline.paymentType === "other" ? "Altro" : deadline.paymentType}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Non specificato</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-primary">
                            {formatCurrency(deadline.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deadline.isPaid ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pagato
                            </Badge>
                          ) : isOverdue(deadline.dueDate) ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              In ritardo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              In attesa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDeadline(deadline)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDeadline(deadline)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Deadline Dialog */}
        <AddEventDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          selectedDate={new Date()}
          initialType="deadline"
        />

        {/* Edit Deadline Dialog */}
        {selectedDeadline && (
          <EditDeadlineDialog
            deadline={selectedDeadline}
            clients={clients}
            projects={projects}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onDeadlineUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["deadlines"] })
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Elimina Scadenza"
          description={`Sei sicuro di voler eliminare la scadenza "${selectedDeadline?.description || 'questa scadenza'}"? Questa azione non può essere annullata.`}
          onConfirm={confirmDeleteDeadline}
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  )
}
