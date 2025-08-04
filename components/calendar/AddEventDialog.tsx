"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
import * as z from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Schema per scadenza
const deadlineFormSchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  amount: z.number().min(0, "L'importo deve essere positivo"),
  dueDate: z.date(),
  paymentType: z.string().min(1, "Il tipo di pagamento è obbligatorio"),
  clientId: z.string().min(1, "Il cliente è obbligatorio"),
  projectId: z.string().optional(),
})
// Schema per task nel dialog (semplificato per compatibilità API)
const dialogTaskFormSchema = z.object({
  title: z.string().min(1, "Il titolo è richiesto"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Il progetto è richiesto"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.date(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  assigneeId: z.string().optional(),
})

type AddEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  initialType?: "deadline" | "task"
}

export function AddEventDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  initialType = "deadline" 
}: AddEventDialogProps) {
  const queryClient = useQueryClient()
  const [eventType, setEventType] = useState<"deadline" | "task">(initialType)

  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      return response.json()
    },
  })

  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      return response.json()
    },
  })

  // Fetch users for task assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    },
  })

  // Deadline form
  const deadlineForm = useForm<z.infer<typeof deadlineFormSchema>>({
    resolver: zodResolver(deadlineFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      dueDate: selectedDate,
      paymentType: "invoice",
      clientId: "",
      projectId: "none",
    },
  })

  // Task form
  const taskForm = useForm<z.infer<typeof dialogTaskFormSchema>>({
    resolver: zodResolver(dialogTaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      priority: "MEDIUM",
      dueDate: selectedDate,
      status: "TODO",
      assigneeId: "",
    },
  })

  // Add deadline mutation
  const addDeadlineMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deadlineFormSchema>) => {
      const response = await fetch("/api/deadlines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate.toISOString(),
          projectId: data.projectId === "none" ? null : data.projectId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante la creazione della scadenza")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Scadenza aggiunta con successo")
      queryClient.invalidateQueries({ queryKey: ["deadlines"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] }) // Refresh calendar events
      onOpenChange(false)
      deadlineForm.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta della scadenza")
    },
  })

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dialogTaskFormSchema>) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate.toISOString(),
          projectId: data.projectId || null,
          assigneeId: data.assigneeId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante la creazione del task")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Task aggiunto con successo")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["deadlines"] }) // Refresh calendar events
      onOpenChange(false)
      taskForm.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta del task")
    },
  })

  const handleSubmitDeadline = (data: z.infer<typeof deadlineFormSchema>) => {
    addDeadlineMutation.mutate(data)
  }

  const handleSubmitTask = (data: z.infer<typeof dialogTaskFormSchema>) => {
    addTaskMutation.mutate(data)
  }

  const onOpenChangeWrapper = (newOpen: boolean) => {
    if (!newOpen) {
      deadlineForm.reset()
      taskForm.reset()
    }
    onOpenChange(newOpen)
  }

  const isLoading = addDeadlineMutation.isPending || addTaskMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChangeWrapper}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Aggiungi evento al calendario</DialogTitle>
          <DialogDescription>
            Seleziona il tipo di evento che vuoi aggiungere per il {format(selectedDate, "d MMMM yyyy", { locale: it })}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs
          value={eventType}
          onValueChange={(value) => setEventType(value as "deadline" | "task")}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="deadline">Scadenza di Pagamento</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deadline">
            <Form {...deadlineForm}>
              <form onSubmit={deadlineForm.handleSubmit(handleSubmitDeadline)} className="space-y-4 mt-4">
                <FormField
                  control={deadlineForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrizione della scadenza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={deadlineForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={deadlineForm.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="invoice">Fattura</SelectItem>
                            <SelectItem value="advance">Anticipo</SelectItem>
                            <SelectItem value="balance">Saldo</SelectItem>
                            <SelectItem value="other">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={deadlineForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deadlineForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progetto (opzionale)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona progetto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nessun progetto</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Aggiungendo..." : "Aggiungi Scadenza"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="task">
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(handleSubmitTask)} className="space-y-4 mt-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo</FormLabel>
                      <FormControl>
                        <Input placeholder="Titolo del task" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrizione del task" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona priorità" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Bassa</SelectItem>
                            <SelectItem value="MEDIUM">Media</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stato</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona stato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TODO">Da fare</SelectItem>
                            <SelectItem value="IN_PROGRESS">In corso</SelectItem>
                            <SelectItem value="REVIEW">In revisione</SelectItem>
                            <SelectItem value="DONE">Completato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={taskForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progetto (opzionale)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona progetto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nessun progetto</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assegnatario (opzionale)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona assegnatario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Non assegnato</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Aggiungendo..." : "Aggiungi Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
