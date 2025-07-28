"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  projectId: string
  assigneeId: string | null
  project?: {
    name: string
    client?: {
      name: string
    }
  }
  assignee?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface TaskDetailsDialogProps {
  taskId: string
  trigger: React.ReactNode
}

export function TaskDetailsDialog({ taskId, trigger }: TaskDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        throw new Error("Errore nel caricamento del task")
      }
      return response.json()
    },
    enabled: open,
  })

  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione del task")
      }
    },
    onSuccess: () => {
      toast.success("Task eliminato con successo")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setOpen(false)
      setIsConfirmDeleteOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'eliminazione del task")
    },
  })

  const handleDelete = () => {
    deleteTask()
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "Bassa"
      case "MEDIUM":
        return "Media"
      case "HIGH":
        return "Alta"
      case "URGENT":
        return "Urgente"
      default:
        return priority
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "Da Fare"
      case "IN_PROGRESS":
        return "In Corso"
      case "REVIEW":
        return "Revisione"
      case "DONE":
        return "Completato"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-blue-100 text-blue-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "URGENT":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "REVIEW":
        return "bg-purple-100 text-purple-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non specificata"
    return format(new Date(dateString), "PPP", { locale: it })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettagli Task</DialogTitle>
            <DialogDescription>
              Visualizza e gestisci i dettagli del task
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : task ? (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{task.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Descrizione</h4>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Progetto</h4>
                    <p className="text-sm">
                      {task.project?.name || "N/A"}
                      {task.project?.client && (
                        <span className="text-gray-500 block text-xs">
                          Cliente: {task.project.client.name}
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Assegnato a</h4>
                    <p className="text-sm">
                      {task.assignee ? (task.assignee.name || task.assignee.email) : "Non assegnato"}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Scadenza</h4>
                    <p className="text-sm">{formatDate(task.dueDate)}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Completato il</h4>
                    <p className="text-sm">{formatDate(task.completedAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Creato il</h4>
                    <p className="text-sm">{formatDate(task.createdAt)}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Ultimo aggiornamento</h4>
                    <p className="text-sm">{formatDate(task.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <EditTaskDialog 
                  task={task} 
                  trigger={<Button variant="outline">Modifica</Button>} 
                />
                <Button 
                  variant="destructive" 
                  disabled={isDeleting}
                  onClick={() => setIsConfirmDeleteOpen(true)}
                >
                  {isDeleting ? "Eliminazione..." : "Elimina"}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Task non trovato
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Elimina Task"
        description="Sei sicuro di voler eliminare questo task? Questa azione non può essere annullata."
      />
    </>
  )
}
