"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ClientForm from "./ClientForm"
import { type ClientFormValues } from "@/lib/schemas/client"

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded?: () => Promise<void>
}

const AddClientDialog = ({ open, onOpenChange, onClientAdded }: AddClientDialogProps) => {
  const queryClient = useQueryClient()

  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      return response.json()
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onOpenChange(false)
      toast.success("Cliente aggiunto con successo!")
      
      // Call the onClientAdded callback if provided
      if (onClientAdded) {
        await onClientAdded()
      }
    },
    onError: (error) => {
      console.error("Failed to add client:", error)
      toast.error("Errore nell'aggiunta del cliente")
    }
  })

  const handleSubmit = (data: ClientFormValues) => {
    addClientMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
        </DialogHeader>
        <ClientForm 
          onSubmit={handleSubmit} 
          isPending={addClientMutation.isPending} 
        />
      </DialogContent>
    </Dialog>
  )
}

export default AddClientDialog
