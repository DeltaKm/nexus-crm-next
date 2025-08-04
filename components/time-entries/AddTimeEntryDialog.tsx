"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"

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
import type { TimeEntryFormData } from "@/types/time-entry"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

interface AddTimeEntryDialogProps {
  projects: Project[]
  tasks: Task[]
  onTimeEntryAdded?: () => void
  trigger?: React.ReactNode
}

export function AddTimeEntryDialog({
  projects,
  tasks,
  onTimeEntryAdded,
  trigger,
}: AddTimeEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TimeEntryFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
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
        throw new Error(errorData.message || "Errore durante il salvataggio")
      }

      const result = await response.json()

      toast({
        title: "Time entry creata",
        description: `Time entry salvata con successo. Durata: ${result.duration} minuti.`,
      })

      setOpen(false)
      onTimeEntryAdded?.()
    } catch (error) {
      console.error("Errore nella creazione time entry:", error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il salvataggio.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuova Time Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Time Entry</DialogTitle>
          <DialogDescription>
            Registra manualmente il tempo lavorato su un progetto.
          </DialogDescription>
        </DialogHeader>
        <TimeEntryForm
          projects={projects}
          tasks={tasks}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
