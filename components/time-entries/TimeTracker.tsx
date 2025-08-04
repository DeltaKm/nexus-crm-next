"use client"

import { useState, useEffect } from "react"
import { Play, Square, Clock, Timer } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import type { ActiveTimer, TimerFormData } from "@/types/time-entry"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

interface TimeTrackerProps {
  projects: Project[]
  tasks: Task[]
  onTimerUpdate?: () => void
}

export function TimeTracker({ projects, tasks, onTimerUpdate }: TimeTrackerProps) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [currentDuration, setCurrentDuration] = useState(0)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Recupera il timer attivo al mount
  useEffect(() => {
    fetchActiveTimer()
  }, [])

  // Aggiorna la durata ogni secondo se c'è un timer attivo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeTimer) {
      interval = setInterval(() => {
        const now = Date.now()
        const start = new Date(activeTimer.startTime).getTime()
        const duration = Math.round((now - start) / 1000 / 60) // in minuti
        setCurrentDuration(duration)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [activeTimer])

  const fetchActiveTimer = async () => {
    try {
      const response = await fetch("/api/time-entries/timer")
      if (response.ok) {
        const data = await response.json()
        setActiveTimer(data.activeTimer)
        if (data.activeTimer) {
          setCurrentDuration(data.activeTimer.duration)
        }
      }
    } catch (error) {
      console.error("Errore nel recupero timer attivo:", error)
    }
  }

  const startTimer = async (data: TimerFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/time-entries/timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startTime: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore nell'avvio del timer")
      }

      const result = await response.json()
      setActiveTimer(result)
      setCurrentDuration(0)
      setIsStartDialogOpen(false)

      toast({
        title: "Timer avviato",
        description: `Timer avviato per il progetto ${result.project.name}.`,
      })

      onTimerUpdate?.()
    } catch (error) {
      console.error("Errore nell'avvio timer:", error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore nell'avvio del timer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/time-entries/timer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore nel fermare il timer")
      }

      const result = await response.json()
      setActiveTimer(null)
      setCurrentDuration(0)

      toast({
        title: "Timer fermato",
        description: `Timer fermato. Durata totale: ${result.duration} minuti.`,
      })

      onTimerUpdate?.()
    } catch (error) {
      console.error("Errore nel fermare timer:", error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore nel fermare il timer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTimer ? (
          <>
            {/* Timer attivo */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-mono font-bold text-primary">
                {formatDuration(currentDuration)}
              </div>
              <Badge variant="secondary" className="animate-pulse">
                <Clock className="mr-1 h-3 w-3" />
                In corso
              </Badge>
            </div>

            {/* Dettagli timer */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Progetto:</span> {activeTimer.project.name}
                {activeTimer.project.client && (
                  <span className="text-muted-foreground ml-1">
                    ({activeTimer.project.client.name})
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Task:</span> {activeTimer.task.title}
              </div>
              <div>
                <span className="font-medium">Descrizione:</span> {activeTimer.description}
              </div>
              <div>
                <span className="font-medium">Iniziato:</span>{" "}
                {format(new Date(activeTimer.startTime), "HH:mm", { locale: it })}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Fatturabile:</span>
                <Badge variant={activeTimer.billable ? "default" : "secondary"}>
                  {activeTimer.billable ? "Sì" : "No"}
                </Badge>
                {activeTimer.rate && (
                  <span className="text-muted-foreground">
                    (€{activeTimer.rate}/h)
                  </span>
                )}
              </div>
            </div>

            {/* Pulsante stop */}
            <Button
              onClick={stopTimer}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <Square className="mr-2 h-4 w-4" />
              {isLoading ? "Fermando..." : "Ferma Timer"}
            </Button>
          </>
        ) : (
          <>
            {/* Nessun timer attivo */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-mono font-bold text-muted-foreground">
                00:00
              </div>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Fermo
              </Badge>
            </div>

            {/* Pulsante start */}
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Avvia Timer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Avvia Timer</DialogTitle>
                  <DialogDescription>
                    Seleziona il progetto e il task per iniziare a tracciare il tempo.
                  </DialogDescription>
                </DialogHeader>
                <TimeEntryForm
                  projects={projects}
                  tasks={tasks}
                  onSubmit={startTimer}
                  isSubmitting={isLoading}
                  isTimerMode={true}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
