"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// Form schema
const editDeadlineSchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  paymentType: z.string().min(1, "Il tipo di pagamento è obbligatorio"),
  dueDate: z.date({
    message: "La data di scadenza è obbligatoria",
  }),
  amount: z.number().min(0.01, "L'importo deve essere maggiore di 0"),
  isPaid: z.boolean(),
  dueNotes: z.string().optional(),
  paymentDate: z.date().optional().nullable(),
  paymentNotes: z.string().optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
})

type EditDeadlineFormData = z.infer<typeof editDeadlineSchema>

interface DeadlinePayment {
  id: string
  description: string
  paymentType: string
  dueDate: string
  amount: number
  dueNotes?: string | null
  isPaid: boolean
  paymentDate?: string | null
  paymentNotes?: string | null
  clientId?: string | null
  projectId?: string | null
  client?: { id: string; name: string; company?: string | null } | null
  project?: { id: string; name: string } | null
}

interface EditDeadlineDialogProps {
  deadline: DeadlinePayment
  clients: Array<{ id: string; name: string; company?: string | null }>
  projects: Array<{ id: string; name: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeadlineUpdated?: () => void
}

export function EditDeadlineDialog({
  deadline,
  clients,
  projects,
  open,
  onOpenChange,
  onDeadlineUpdated,
}: EditDeadlineDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<EditDeadlineFormData>({
    resolver: zodResolver(editDeadlineSchema),
    defaultValues: {
      description: deadline.description || "",
      paymentType: deadline.paymentType || "",
      dueDate: new Date(deadline.dueDate),
      amount: deadline.amount || 0,
      isPaid: deadline.isPaid || false,
      dueNotes: deadline.dueNotes || "",
      paymentDate: deadline.paymentDate ? new Date(deadline.paymentDate) : null,
      paymentNotes: deadline.paymentNotes || "",
      clientId: deadline.clientId || null,
      projectId: deadline.projectId || null,
    },
  })

  // Reset form when deadline changes
  useEffect(() => {
    if (deadline) {
      form.reset({
        description: deadline.description || "",
        paymentType: deadline.paymentType || "",
        dueDate: new Date(deadline.dueDate),
        amount: deadline.amount || 0,
        isPaid: deadline.isPaid || false,
        dueNotes: deadline.dueNotes || "",
        paymentDate: deadline.paymentDate ? new Date(deadline.paymentDate) : null,
        paymentNotes: deadline.paymentNotes || "",
        clientId: deadline.clientId || null,
        projectId: deadline.projectId || null,
      })
    }
  }, [deadline, form])

  const updateMutation = useMutation({
    mutationFn: async (data: EditDeadlineFormData) => {
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString(),
        paymentDate: data.paymentDate ? data.paymentDate.toISOString() : null,
        dueNotes: data.dueNotes || null,
        paymentNotes: data.paymentNotes || null,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
      }

      const response = await fetch(`/api/deadlines/${deadline.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore durante l'aggiornamento della scadenza")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] })
      toast({
        title: "Scadenza aggiornata",
        description: "La scadenza è stata aggiornata con successo.",
      })
      onDeadlineUpdated?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: EditDeadlineFormData) => {
    updateMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Scadenza</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione *</FormLabel>
                  <FormControl>
                    <Input placeholder="Inserisci descrizione..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Type */}
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fattura">Fattura</SelectItem>
                        <SelectItem value="Ricevuta">Ricevuta</SelectItem>
                        <SelectItem value="Bonifico">Bonifico</SelectItem>
                        <SelectItem value="Contanti">Contanti</SelectItem>
                        <SelectItem value="Assegno">Assegno</SelectItem>
                        <SelectItem value="Altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo (€) *</FormLabel>
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
            </div>

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Scadenza *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Seleziona data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Client */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessun cliente</SelectItem>
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

              {/* Project */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progetto</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona progetto..." />
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
            </div>

            {/* Due Notes */}
            <FormField
              control={form.control}
              name="dueNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Scadenza</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive sulla scadenza..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Status */}
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Pagamento completato</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Payment Date - only show if isPaid is true */}
            {form.watch("isPaid") && (
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Pagamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleziona data pagamento</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Payment Notes - only show if isPaid is true */}
            {form.watch("isPaid") && (
              <FormField
                control={form.control}
                name="paymentNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Pagamento</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note sul pagamento..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Aggiornamento..." : "Aggiorna Scadenza"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
