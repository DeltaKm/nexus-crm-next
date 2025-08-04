"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { timeEntrySchema } from "@/lib/validations/time-entry"
import type { TimeEntryFormData } from "@/types/time-entry"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"
import { cn } from "@/lib/utils"

interface TimeEntryFormProps {
  projects: Project[]
  tasks: Task[]
  onSubmit: (data: TimeEntryFormData) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<TimeEntryFormData>
  isTimerMode?: boolean // Se true, nasconde il campo endTime
}

export function TimeEntryForm({
  projects,
  tasks,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  isTimerMode = false,
}: TimeEntryFormProps) {
  const form = useForm({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      description: "",
      startTime: new Date(),
      endTime: isTimerMode ? undefined : new Date(),
      billable: true,
      rate: undefined,
      taskId: "",
      projectId: "",
      ...defaultValues,
    },
  })

  const selectedProjectId = form.watch("projectId")
  
  // Filtra i task in base al progetto selezionato
  const filteredTasks = tasks.filter(task => 
    !selectedProjectId || task.projectId === selectedProjectId
  )

  const handleSubmit = async (data: TimeEntryFormData) => {
    try {
      await onSubmit(data)
      if (!defaultValues) {
        form.reset()
      }
    } catch (error) {
      console.error("Errore nel submit:", error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Descrizione */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrizione *</Label>
        <Textarea
          id="description"
          placeholder="Descrivi l'attività svolta..."
          className="min-h-[80px]"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Progetto e Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectId">Progetto *</Label>
          <Select
            value={form.watch("projectId")}
            onValueChange={(value) => {
              form.setValue("projectId", value)
              form.setValue("taskId", "") // Reset task quando cambia progetto
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona progetto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                  {project.client && (
                    <span className="text-muted-foreground ml-2">
                      ({project.client.name})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.projectId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.projectId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taskId">Task *</Label>
          <Select
            value={form.watch("taskId")}
            onValueChange={(value) => form.setValue("taskId", value)}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona task" />
            </SelectTrigger>
            <SelectContent>
              {filteredTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.taskId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.taskId.message}
            </p>
          )}
        </div>
      </div>

      {/* Data e ora inizio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data e ora inizio *</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !form.watch("startTime") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("startTime") ? (
                    format(form.watch("startTime"), "dd/MM/yyyy", { locale: it })
                  ) : (
                    "Seleziona data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("startTime")}
                  onSelect={(date) => {
                    if (date) {
                      const currentTime = form.watch("startTime") || new Date()
                      const newDateTime = new Date(date)
                      newDateTime.setHours(currentTime.getHours())
                      newDateTime.setMinutes(currentTime.getMinutes())
                      form.setValue("startTime", newDateTime)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              className="w-32"
              value={form.watch("startTime") ? format(form.watch("startTime"), "HH:mm") : ""}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":")
                const currentDate = form.watch("startTime") || new Date()
                const newDateTime = new Date(currentDate)
                newDateTime.setHours(parseInt(hours))
                newDateTime.setMinutes(parseInt(minutes))
                form.setValue("startTime", newDateTime)
              }}
            />
          </div>
          {form.formState.errors.startTime && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startTime.message}
            </p>
          )}
        </div>

        {/* Data e ora fine (solo se non è timer mode) */}
        {!isTimerMode && (
          <div className="space-y-2">
            <Label>Data e ora fine</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !form.watch("endTime") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("endTime") ? (
                      format(form.watch("endTime")!, "dd/MM/yyyy", { locale: it })
                    ) : (
                      "Seleziona data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("endTime") || undefined}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = form.watch("endTime") || new Date()
                        const newDateTime = new Date(date)
                        newDateTime.setHours(currentTime.getHours())
                        newDateTime.setMinutes(currentTime.getMinutes())
                        form.setValue("endTime", newDateTime)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                className="w-32"
                value={form.watch("endTime") ? format(form.watch("endTime")!, "HH:mm") : ""}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":")
                  const currentDate = form.watch("endTime") || new Date()
                  const newDateTime = new Date(currentDate)
                  newDateTime.setHours(parseInt(hours))
                  newDateTime.setMinutes(parseInt(minutes))
                  form.setValue("endTime", newDateTime)
                }}
              />
            </div>
            {form.formState.errors.endTime && (
              <p className="text-sm text-destructive">
                {form.formState.errors.endTime.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fatturabile e Tariffa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="billable"
            checked={form.watch("billable")}
            onCheckedChange={(checked) => form.setValue("billable", checked)}
          />
          <Label htmlFor="billable">Ore fatturabili</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Tariffa oraria (€)</Label>
          <Input
            id="rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="50.00"
            {...form.register("rate", { valueAsNumber: true })}
          />
          {form.formState.errors.rate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.rate.message}
            </p>
          )}
        </div>
      </div>

      {/* Pulsanti */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              {isTimerMode ? "Avvio timer..." : "Salvataggio..."}
            </>
          ) : (
            isTimerMode ? "Avvia Timer" : "Salva Time Entry"
          )}
        </Button>
      </div>
    </form>
  )
}
