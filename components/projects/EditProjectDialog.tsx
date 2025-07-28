"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  budget?: number | null
  notes?: string | null
  completed: number
  repository?: string | null
  clientId: string
  createdAt: string
}

interface EditProjectDialogProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onProjectUpdate?: () => void
}

export default function EditProjectDialog({
  project,
  isOpen,
  onClose,
  onProjectUpdate,
}: EditProjectDialogProps) {
  const queryClient = useQueryClient()
  
  const { mutate: updateProject, isPending } = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Si è verificato un errore durante l'aggiornamento del progetto")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Progetto aggiornato con successo")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onClose()
      if (onProjectUpdate) {
        onProjectUpdate()
      }
    },
    onError: (error) => {
      toast.error(error.message || "Si è verificato un errore durante l'aggiornamento del progetto")
    },
  })

  const handleSubmit = (data: ProjectFormValues) => {
    updateProject(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Progetto</DialogTitle>
          <DialogDescription>
            Modifica i dettagli del progetto. I campi con * sono obbligatori.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm 
          defaultValues={{
            name: project.name,
            description: project.description,
            clientId: project.clientId,
            startDate: project.startDate || "",
            endDate: project.endDate || "",
            status: project.status as "planning" | "in-progress" | "review" | "completed" | "on-hold",
            budget: project.budget,
            notes: project.notes,
            completed: project.completed,
            repository: project.repository,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
