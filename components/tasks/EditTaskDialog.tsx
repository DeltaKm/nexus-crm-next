"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskFormValues } from "@/lib/validations/task"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  assigneeId: string | null
}

interface EditTaskDialogProps {
  task: Task
  trigger: React.ReactNode
}

export function EditTaskDialog({ task, trigger }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { mutate: updateTask, isPending } = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante l'aggiornamento del task")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Task aggiornato con successo")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", task.id] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks", task.projectId] })
      setOpen(false)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento del task")
    },
  })

  const handleSubmit = (data: TaskFormValues) => {
    updateTask(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifica Task</DialogTitle>
          <DialogDescription>
            Modifica i dettagli del task.
          </DialogDescription>
        </DialogHeader>
        <TaskForm 
          defaultValues={{
            title: task.title,
            description: task.description,
            status: task.status as any,
            priority: task.priority as any,
            dueDate: task.dueDate,
            projectId: task.projectId,
            assigneeId: task.assigneeId,
          }}
          onSubmit={handleSubmit} 
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
