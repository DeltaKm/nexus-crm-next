"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TimeEntryForm } from "./TimeEntryForm"
import { toast } from "@/components/ui/use-toast"
import type { TimeEntryFormData, TimeEntryWithRelations } from "@/types/time-entry"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

interface EditTimeEntryDialogProps {
  timeEntry: TimeEntryWithRelations
  projects: Project[]
  tasks: Task[]
  onTimeEntryUpdated?: () => void
  trigger?: React.ReactNode
}

export function EditTimeEntryDialog({
  timeEntry,
  projects,
  tasks,
  onTimeEntryUpdated,
  trigger,
}: EditTimeEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TimeEntryFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/time-entries/${timeEntry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startTime: data.startTime.toISOString(),
          endTime: data.endTime?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore durante l'aggiornamento")
      }

      const result = await response.json()

      toast({
        title: "Time entry aggiornata",
        description: `Time entry aggiornata con successo. Durata: ${result.duration} minuti.`,
      })

      setOpen(false)
      onTimeEntryUpdated?.()
    } catch (error) {
      console.error("Errore nell'aggiornamento time entry:", error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante l'aggiornamento.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prepara i valori di default dal time entry esistente
  const defaultValues: Partial<TimeEntryFormData> = {
    description: timeEntry.description,
    startTime: new Date(timeEntry.startTime),
    endTime: timeEntry.endTime ? new Date(timeEntry.endTime) : undefined,
    billable: timeEntry.billable,
    rate: timeEntry.rate || undefined,
    taskId: timeEntry.taskId,
    projectId: timeEntry.projectId,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Time Entry</DialogTitle>
          <DialogDescription>
            Modifica i dettagli della time entry.
          </DialogDescription>
        </DialogHeader>
        <TimeEntryForm
          projects={projects}
          tasks={tasks}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  )
}
