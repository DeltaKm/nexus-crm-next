"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Edit, Trash2, Mail, Phone, MapPin, Calendar, User } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { it } from "date-fns/locale"

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

interface ClientDetailsDialogProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onClientUpdate: () => void
  onEditClient: (client: Client) => void
}

const ClientDetailsDialog = ({ 
  client, 
  isOpen, 
  onClose, 
  onClientUpdate,
  onEditClient 
}: ClientDetailsDialogProps) => {
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Tentativo eliminazione cliente con ID:', id)
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Errore API:', errorData)
        throw new Error(`Errore nell'eliminazione del cliente: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Eliminazione riuscita:', result)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClientUpdate()
      onClose()
      toast.success("Cliente eliminato con successo")
    },
    onError: (error) => {
      console.error("Error deleting client:", error)
      toast.error("Errore nell'eliminazione del cliente")
    }
  })

  const handleDeleteClient = () => {
    if (!client) return
    console.log('Tentativo eliminazione cliente:', client.name, 'ID:', client.id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!client) return
    console.log('Confermata eliminazione, eseguendo mutazione...')
    deleteClientMutation.mutate(client.id)
    setShowDeleteConfirm(false)
  }

  const cancelDelete = () => {
    console.log('Eliminazione annullata dall\'utente')
    setShowDeleteConfirm(false)
  }

  const handleEditClient = () => {
    if (!client) return
    onEditClient(client)
  }

  if (!client) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {client.name}
              <Badge variant={client.status === "active" ? "default" : "secondary"}>
                {client.status === "active" ? "Attivo" : "Inattivo"}
              </Badge>
            </DialogTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleEditClient}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={handleDeleteClient}
                disabled={deleteClientMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informazioni principali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.company && (
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Azienda</p>
                  <p className="text-sm text-gray-600">{client.company}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Telefono</p>
                  <p className="text-sm text-gray-600">{client.phone}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Indirizzo</p>
                  <p className="text-sm text-gray-600">{client.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-sm text-gray-600 capitalize">{client.category}</p>
              </div>
            </div>

            {client.lastContact && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Ultimo contatto</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(client.lastContact), "dd MMMM yyyy", { locale: it })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {client.notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">Note</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {client.notes}
              </p>
            </div>
          )}

          {/* Statistiche */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Statistiche</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <p className="text-2xl font-bold text-blue-600">
                  {client._count?.projects || 0}
                </p>
                <p className="text-sm text-blue-600">Progetti</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-600">
                  {client._count?.invoices || 0}
                </p>
                <p className="text-sm text-green-600">Fatture</p>
              </div>
            </div>
          </div>

          {/* Informazioni di sistema */}
          <div className="border-t pt-4 text-xs text-gray-500">
            <p>Creato il {format(new Date(client.createdAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
            <p>Creato da {client.creator.name}</p>
          </div>
        </div>
      </DialogContent>
      
      {/* Dialog di conferma eliminazione */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Sei sicuro di voler eliminare il cliente <strong>{client?.name}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Questa azione non può essere annullata.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={cancelDelete}
              disabled={deleteClientMutation.isPending}
            >
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteClientMutation.isPending}
            >
              {deleteClientMutation.isPending ? "Eliminando..." : "Elimina"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default ClientDetailsDialog
