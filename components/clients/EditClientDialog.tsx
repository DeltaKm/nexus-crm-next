"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import ClientForm from "./ClientForm"
import { type ClientFormValues } from "@/lib/schemas/client"

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
}

interface EditClientDialogProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onClientUpdate: () => void
}

const EditClientDialog = ({ 
  client, 
  isOpen, 
  onClose, 
  onClientUpdate 
}: EditClientDialogProps) => {
  const queryClient = useQueryClient()

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      if (!client) throw new Error("Cliente non trovato")
      
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento del cliente')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClientUpdate()
      onClose()
      toast.success("Cliente aggiornato con successo")
    },
    onError: (error) => {
      console.error("Failed to update client:", error)
      toast.error("Errore nell'aggiornamento del cliente")
    }
  })

  const handleSubmit = (data: ClientFormValues) => {
    updateClientMutation.mutate(data)
  }

  if (!client) return null

  // Prepara i valori di default per il form
  const defaultValues: Partial<ClientFormValues> = {
    name: client.name,
    company: client.company || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    category: client.category as "standard" | "premium",
    status: client.status as "active" | "inactive",
    notes: client.notes || "",
    lastContact: client.lastContact || "",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Cliente</DialogTitle>
        </DialogHeader>
        <ClientForm 
          defaultValues={defaultValues}
          onSubmit={handleSubmit} 
          isPending={updateClientMutation.isPending} 
        />
      </DialogContent>
    </Dialog>
  )
}

export default EditClientDialog
