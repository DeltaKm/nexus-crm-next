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
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskFormValues } from "@/lib/validations/task"

interface AddTaskDialogProps {
  projectId?: string
  trigger: React.ReactNode
}

export function AddTaskDialog({ projectId, trigger }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante la creazione del task")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Task creato con successo")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      }
      setOpen(false)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante la creazione del task")
    },
  })

  const handleSubmit = (data: TaskFormValues) => {
    createTask(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuovo Task</DialogTitle>
          <DialogDescription>
            Compila il form per creare un nuovo task.
          </DialogDescription>
        </DialogHeader>
        <TaskForm 
          onSubmit={handleSubmit} 
          isSubmitting={isPending}
          projectId={projectId}
        />
      </DialogContent>
    </Dialog>
  )
}
