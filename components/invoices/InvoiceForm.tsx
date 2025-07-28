"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { invoiceFormSchema, InvoiceFormValues, invoiceItemFormSchema } from "@/lib/validations/invoice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Client {
  id: string
  name: string
  company?: string | null
}

interface Project {
  id: string
  name: string
}

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  timeEntryId?: string | null
}

interface InvoiceFormProps {
  defaultValues?: Partial<InvoiceFormValues> & { items?: InvoiceItem[] }
  clients: Client[]
  projects: Project[]
  onSubmit: (data: InvoiceFormValues & { items: InvoiceItem[] }) => void
  isSubmitting?: boolean
}

export function InvoiceForm({
  defaultValues,
  clients,
  projects,
  onSubmit,
  isSubmitting = false,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(defaultValues?.items || [])
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
  })
  const [itemError, setItemError] = useState<string | null>(null)

  // Inizializza il form con i valori predefiniti
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: {
      invoiceNumber: defaultValues?.invoiceNumber || "",
      issueDate: defaultValues?.issueDate ? new Date(defaultValues.issueDate) : new Date(),
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : new Date(),
      status: defaultValues?.status || "DRAFT",
      taxRate: defaultValues?.taxRate || 0,
      notes: defaultValues?.notes || "",
      clientId: defaultValues?.clientId || "",
      projectId: defaultValues?.projectId || "",
    },
  })

  // Funzione per aggiungere un elemento alla fattura
  const handleAddItem = () => {
    try {
      // Valida l'elemento prima di aggiungerlo
      const validatedItem = invoiceItemFormSchema.parse(newItem)
      
      setItems([...items, validatedItem])
      setNewItem({
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
      })
      setItemError(null)
    } catch (error: any) {
      setItemError(error.errors?.[0]?.message || "Errore nella validazione dell'elemento")
    }
  }

  // Funzione per rimuovere un elemento dalla fattura
  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  // Funzione per gestire l'invio del form
  const handleFormSubmit = (data: InvoiceFormValues) => {
    if (items.length === 0) {
      setItemError("Aggiungi almeno un elemento alla fattura")
      return
    }

    // Combina i dati del form con gli elementi della fattura
    const invoiceData = {
      ...data,
      items,
    }

    onSubmit(invoiceData as InvoiceFormValues & { items: InvoiceItem[] })
  }

  // Calcola il totale della fattura
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice
      const tax = itemTotal * (item.taxRate / 100)
      return total + itemTotal + tax
    }, 0)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Numero Fattura */}
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero Fattura</FormLabel>
                <FormControl>
                  <Input placeholder="es. INV-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cliente */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data Emissione */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Emissione</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
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
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data Scadenza */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Scadenza</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
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
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stato */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona uno stato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="SENT">Inviata</SelectItem>
                    <SelectItem value="PAID">Pagata</SelectItem>
                    <SelectItem value="OVERDUE">Scaduta</SelectItem>
                    <SelectItem value="CANCELLED">Annullata</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Progetto (opzionale) */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progetto (opzionale)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un progetto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nessun progetto</SelectItem>
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

          {/* Aliquota IVA */}
          <FormField
            control={form.control}
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aliquota IVA (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="es. 22"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Note */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Inserisci eventuali note..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Elementi Fattura */}
        <Card>
          <CardHeader>
            <CardTitle>Elementi Fattura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tabella elementi */}
              {items.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrizione</TableHead>
                        <TableHead className="w-[100px] text-right">Quantità</TableHead>
                        <TableHead className="w-[120px] text-right">Prezzo</TableHead>
                        <TableHead className="w-[80px] text-right">IVA %</TableHead>
                        <TableHead className="w-[120px] text-right">Totale</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.taxRate}%</TableCell>
                          <TableCell className="text-right">
                            €{((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-medium">
                          Totale
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          €{calculateTotal().toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Form per aggiungere un nuovo elemento */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Descrizione</label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Descrizione elemento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantità</label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="Quantità"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prezzo (€)</label>
                  <Input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="Prezzo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">IVA (%)</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={newItem.taxRate}
                      onChange={(e) => setNewItem({ ...newItem, taxRate: parseFloat(e.target.value) || 0 })}
                      placeholder="IVA %"
                    />
                    <Button type="button" onClick={handleAddItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Errore elementi */}
              {itemError && (
                <p className="text-sm font-medium text-destructive">{itemError}</p>
              )}

              {/* Messaggio se non ci sono elementi */}
              {items.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nessun elemento aggiunto alla fattura
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pulsante di invio */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            "Salva Fattura"
          )}
        </Button>
      </form>
    </Form>
  )
}
