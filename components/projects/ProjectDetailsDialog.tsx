"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Building2,
  Clock,
  DollarSign,
  FileText,
  GitBranch,
  Trash2,
  Edit,
  X,
  ExternalLink,
} from "lucide-react"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
  createdAt: string
  clientId: string
  client: {
    id: string
    name: string
    company?: string | null
  }
  creator: {
    id: string
    name: string
    email: string
  }
  _count?: {
    tasks: number
    timeEntries: number
  }
}

interface ProjectDetailsDialogProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onProjectUpdate: () => void
  onEditProject: (project: Project) => void
}

export default function ProjectDetailsDialog({
  project,
  isOpen,
  onClose,
  onProjectUpdate,
  onEditProject,
}: ProjectDetailsDialogProps) {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Si è verificato un errore durante l'eliminazione del progetto")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Progetto eliminato con successo")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsConfirmDeleteOpen(false)
      onClose()
      onProjectUpdate()
    },
    onError: (error) => {
      toast.error(error.message || "Si è verificato un errore durante l'eliminazione del progetto")
    },
  })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Pianificazione"
      case "in-progress":
        return "In Corso"
      case "review":
        return "Revisione"
      case "completed":
        return "Completato"
      case "on-hold":
        return "In Pausa"
      default:
        return status
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "planning":
        return "secondary"
      case "in-progress":
        return "default"
      case "review":
        return "secondary"
      case "completed":
        return "outline"
      case "on-hold":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Non specificata"
    return format(new Date(dateString), "PPP", { locale: it })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center">
                <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                <span>{project.client.name}</span>
                {project.client.company && (
                  <span className="text-gray-500 ml-1">({project.client.company})</span>
                )}
              </DialogDescription>
            </div>
            <div className="mr-4">
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Avanzamento</span>
                <span>{project.completed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${project.completed}%` }}
                ></div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="space-y-2">
                <h3 className="font-medium">Descrizione</h3>
                <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Data Inizio</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{formatDate(project.startDate)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Data Fine</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{formatDate(project.endDate)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Budget</p>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <span>
                    {project.budget
                      ? `€${project.budget.toLocaleString()}`
                      : "Non specificato"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Task</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{project._count?.tasks || 0} task</span>
                </div>
              </div>
            </div>

            {/* Repository */}
            {project.repository && (
              <div className="space-y-2">
                <h3 className="font-medium">Repository</h3>
                <div className="flex items-center">
                  <GitBranch className="h-4 w-4 text-gray-400 mr-2" />
                  <a
                    href={project.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {project.repository}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}

            {/* Notes */}
            {project.notes && (
              <div className="space-y-2">
                <h3 className="font-medium">Note</h3>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <FileText className="h-4 w-4 text-gray-400 mb-2" />
                  <p className="text-gray-700 whitespace-pre-line">{project.notes}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 pt-4 border-t">
              <p>Creato il {format(new Date(project.createdAt), "PPP", { locale: it })}</p>
              <p>Da {project.creator.name}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Elimina
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onEditProject(project)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifica
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={deleteProject}
        title="Elimina Progetto"
        description={`Sei sicuro di voler eliminare il progetto "${project.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        isSubmitting={isDeleting}
      />
    </>
  )
}
