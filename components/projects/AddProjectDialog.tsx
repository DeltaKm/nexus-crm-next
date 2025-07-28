"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ProjectForm } from "./ProjectForm"
import { type ProjectFormValues } from "@/lib/validations/project"

interface AddProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectAdded?: () => void
}

export default function AddProjectDialog({
  open,
  onOpenChange,
  onProjectAdded,
}: AddProjectDialogProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Si è verificato un errore durante la creazione del progetto")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Progetto creato con successo")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      if (onProjectAdded) {
        onProjectAdded()
      }
    },
    onError: (error) => {
      toast.error(error.message || "Si è verificato un errore durante la creazione del progetto")
    },
  })

  const handleSubmit = (data: ProjectFormValues) => {
    createProject(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Progetto</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli del nuovo progetto. I campi con * sono obbligatori.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm 
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
