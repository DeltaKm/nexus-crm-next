"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Clock, Play, Square, Pencil, Trash2, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditTimeEntryDialog } from "./EditTimeEntryDialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import type { TimeEntryWithRelations } from "@/types/time-entry"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

interface TimeEntriesListProps {
  timeEntries: TimeEntryWithRelations[]
  projects: Project[]
  tasks: Task[]
  onTimeEntryUpdated?: () => void
  showGrouping?: boolean
}

export function TimeEntriesList({
  timeEntries,
  projects,
  tasks,
  onTimeEntryUpdated,
  showGrouping = false,
}: TimeEntriesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (timeEntryId: string) => {
    setDeletingId(timeEntryId)
    try {
      const response = await fetch(`/api/time-entries/${timeEntryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione")
      }

      toast({
        title: "Time entry eliminata",
        description: "La time entry è stata eliminata con successo.",
      })

      onTimeEntryUpdated?.()
    } catch (error) {
      console.error("Errore nell'eliminazione:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const calculateValue = (timeEntry: TimeEntryWithRelations) => {
    if (!timeEntry.billable || !timeEntry.rate) return 0
    return (timeEntry.duration / 60) * timeEntry.rate
  }

  const groupedEntries = showGrouping
    ? timeEntries.reduce((groups, entry) => {
        const date = format(new Date(entry.startTime), "yyyy-MM-dd")
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(entry)
        return groups
      }, {} as Record<string, TimeEntryWithRelations[]>)
    : { all: timeEntries }

  if (timeEntries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessuna time entry</h3>
          <p className="text-muted-foreground">
            Non ci sono time entries per il periodo selezionato.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEntries).map(([groupKey, entries]) => (
        <Card key={groupKey}>
          {showGrouping && groupKey !== "all" && (
            <CardHeader>
              <CardTitle className="text-lg">
                {format(new Date(groupKey), "EEEE, dd MMMM yyyy", { locale: it })}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Progetto</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Orario</TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Valore</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((timeEntry) => (
                  <TableRow key={timeEntry.id}>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={timeEntry.description}>
                        {timeEntry.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{timeEntry.project.name}</div>
                        {timeEntry.project.client && (
                          <div className="text-sm text-muted-foreground">
                            {timeEntry.project.client.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={timeEntry.task.title}>
                        {timeEntry.task.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {format(new Date(timeEntry.startTime), "HH:mm", { locale: it })}
                          {timeEntry.endTime && (
                            <> - {format(new Date(timeEntry.endTime), "HH:mm", { locale: it })}</>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(timeEntry.startTime), "dd/MM/yyyy", { locale: it })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {timeEntry.isRunning ? (
                          <Badge variant="secondary" className="animate-pulse">
                            <Play className="mr-1 h-3 w-3" />
                            In corso
                          </Badge>
                        ) : (
                          <span className="font-mono">
                            {formatDuration(timeEntry.duration)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={timeEntry.billable ? "default" : "secondary"}>
                          {timeEntry.billable ? "Fatturabile" : "Non fatturabile"}
                        </Badge>
                        {timeEntry.rate && (
                          <span className="text-sm text-muted-foreground">
                            €{timeEntry.rate}/h
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {timeEntry.billable && timeEntry.rate ? (
                        <span className="font-medium">
                          {formatCurrency(calculateValue(timeEntry))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditTimeEntryDialog
                            timeEntry={timeEntry}
                            projects={projects}
                            tasks={tasks}
                            onTimeEntryUpdated={onTimeEntryUpdated}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifica
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <ConfirmDialog
                            title="Elimina Time Entry"
                            description="Sei sicuro di voler eliminare questa time entry? Questa azione non può essere annullata."
                            onConfirm={() => handleDelete(timeEntry.id)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive"
                                disabled={deletingId === timeEntry.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingId === timeEntry.id ? "Eliminando..." : "Elimina"}
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
