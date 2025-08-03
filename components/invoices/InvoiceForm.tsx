"use client"

import * as z from "zod"
import { useFieldArray, UseFormReturn, useForm as useHookForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

// Import types and schema
import { 
  invoiceSchema,
  InvoiceStatus,
  InvoiceFormWithItems
} from "@/lib/validations/invoice"
import { Client } from "@/types/client"
import { Project } from "@/types/project"

// Default empty form values
const defaultFormValues: InvoiceFormWithItems = {
  invoiceNumber: "",
  issueDate: new Date(),
  dueDate: (() => {
    const date = new Date()
    date.setDate(date.getDate() + 30) // 30 giorni dalla data di emissione
    return date
  })(),
  status: "DRAFT",
  taxRate: 22,
  notes: null,
  clientId: "",
  projectId: null,
  items: [
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 22,
      timeEntryId: null
    }
  ]
}

// Custom hook for form with proper type
export function useInvoiceForm(initialValues?: Partial<InvoiceFormWithItems>) {
  return useHookForm({
    resolver: zodResolver(invoiceSchema) as any, // Use invoiceSchema to include items
    defaultValues: {
      ...defaultFormValues,
      ...initialValues,
      items: initialValues?.items?.length 
        ? [...initialValues.items] 
        : [...defaultFormValues.items]
    } as InvoiceFormWithItems
  })
}

// Export the form type
type InvoiceFormType = ReturnType<typeof useInvoiceForm>

interface InvoiceFormProps {
  form: InvoiceFormType
  clients: Client[]
  projects: Project[]
  onSubmit: (data: InvoiceFormWithItems) => Promise<void>
  isSubmitting?: boolean
  formErrors?: Record<string, string>
}

export function InvoiceForm({
  form,
  clients = [],
  projects = [],
  onSubmit,
  isSubmitting = false,
  formErrors = {},
}: InvoiceFormProps) {
  const handleSubmit = async (formData: InvoiceFormWithItems) => {
    console.log('🎯 InvoiceForm handleSubmit called!')
    console.log('📋 Raw form data:', JSON.stringify(formData, null, 2))
    
    try {
      // Validate required fields
      if (!formData.clientId) {
        form.setError('clientId', { message: 'Il cliente è obbligatorio' })
        return
      }
      
      if (!formData.invoiceNumber) {
        form.setError('invoiceNumber', { message: 'Il numero fattura è obbligatorio' })
        return
      }
      
      // Ensure items exists and is an array, default to empty array if not
      const itemsArray = Array.isArray(formData.items) ? formData.items : [];
      console.log('📦 Items array:', itemsArray)
      
      // Validate at least one item with description
      const validItems = itemsArray.filter(item => item.description && item.description.trim() !== '')
      if (validItems.length === 0) {
        form.setError('items', { message: 'È necessario aggiungere almeno una riga con descrizione' })
        return
      }
      
      // Ensure numeric values are properly converted
      const processedData: InvoiceFormWithItems = {
        ...formData,
        items: itemsArray.map(item => ({
          description: item?.description || '',
          quantity: Number(item?.quantity) || 0,
          unitPrice: Number(item?.unitPrice) || 0,
          taxRate: Number(item?.taxRate) || 22,
          timeEntryId: item?.timeEntryId || null,
        }))
      };
      
      console.log('✅ Processed form data:', JSON.stringify(processedData, null, 2))
      console.log('🚀 Calling parent onSubmit function...')
      await onSubmit(processedData)
    } catch (error: any) {
      console.error('Error submitting invoice:', error)
      
      // Handle specific API errors
      if (error?.response?.status === 409) {
        // Duplicate invoice number
        form.setError('invoiceNumber', { 
          message: error.response.data?.message || 'Numero fattura già esistente' 
        })
      } else if (error?.message) {
        // Generic error
        form.setError('root', { message: error.message })
      }
    }
  }
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Watch form values for live total calculation
  const watchedItems = form.watch("items")
  
  // Calculate live total directly (no state, always fresh)
  const calculateLiveTotal = (): string => {
    const currentItems = watchedItems || form.getValues("items")
    if (!currentItems || !Array.isArray(currentItems) || currentItems.length === 0) {
      return '0.00'
    }
    
    const total = currentItems.reduce((sum: number, item) => {
      const quantity = Number(item?.quantity) || 0
      const unitPrice = Number(item?.unitPrice) || 0
      const taxRate = Number(item?.taxRate) || 0
      const subtotal = quantity * unitPrice
      const tax = (subtotal * taxRate) / 100
      return sum + subtotal + tax
    }, 0)
    
    return total.toFixed(2)
  }
  
  // Get form state for error handling
  const { errors } = form.formState
  
  // Helper function to get error message for a field
  const getErrorMessage = (fieldName: string) => {
    // Handle nested field names like 'items.0.description'
    const fieldParts = fieldName.split('.')
    let currentError: any = errors
    
    for (const part of fieldParts) {
      if (currentError && typeof currentError === 'object' && part in currentError) {
        currentError = currentError[part]
      } else {
        currentError = null
        break
      }
    }
    
    if (currentError?.message) {
      return currentError.message as string
    }
    
    return formErrors[fieldName] || ''
  }

  const handleAddItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 22,
    })
  }

  const calculateItemTotal = (index: number): string => {
    const items = watchedItems || form.getValues("items")
    const item = items?.[index]
    if (!item) return '0.00'
    
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const taxRate = Number(item.taxRate) || 0
    const subtotal = quantity * unitPrice
    const tax = (subtotal * taxRate) / 100
    const total = subtotal + tax
    
    return total.toFixed(2)
  }

  const calculateTotal = (): string => {
    const items = form.getValues("items")
    if (!items || !Array.isArray(items) || items.length === 0) return '0.00'
    
    const total = items.reduce((sum: number, item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const taxRate = Number(item.taxRate) || 0
      const subtotal = quantity * unitPrice
      const tax = (subtotal * taxRate) / 100
      return sum + subtotal + tax
    }, 0)
    
    return total.toFixed(2)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="invoiceNumber" className="flex items-center gap-1">
              Numero Fattura
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              {...form.register("invoiceNumber")}
              className={getErrorMessage('invoiceNumber') ? 'border-destructive' : ''}
              placeholder="Es: FATT-2025-001"
            />
            {getErrorMessage('invoiceNumber') && (
              <p className="text-xs text-destructive mt-1">
                {getErrorMessage('invoiceNumber')}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="clientId" className="flex items-center gap-1">
              Cliente
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("clientId") || ""}
              onValueChange={(value) => {
                form.setValue("clientId", value)
                // Reset project when client changes
                form.setValue("projectId", null)
              }}
            >
              <SelectTrigger className={getErrorMessage('clientId') ? 'border-destructive' : ''}>
                <SelectValue placeholder="Seleziona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage('clientId') && (
              <p className="text-xs text-destructive mt-1">
                {getErrorMessage('clientId')}
              </p>
            )}
          </div>
          <div>
            <Label>Data Emissione</Label>
            <div className="space-y-1">
              <Input
                type="date"
                className={getErrorMessage('issueDate') ? 'border-destructive' : ''}
                {...form.register("issueDate", { 
                  valueAsDate: true,
                  onChange: (e) => {
                    // Auto-calculate due date when issue date changes
                    const issueDate = new Date(e.target.value)
                    if (!isNaN(issueDate.getTime())) {
                      const dueDate = new Date(issueDate)
                      dueDate.setDate(dueDate.getDate() + 30)
                      form.setValue("dueDate", dueDate)
                    }
                  }
                })}
              />
              {getErrorMessage('issueDate') && (
                <p className="text-xs text-destructive">
                  {getErrorMessage('issueDate')}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Data Scadenza</Label>
            <div className="space-y-1">
              <Input
                type="date"
                className={getErrorMessage('dueDate') ? 'border-destructive' : ''}
                {...form.register("dueDate", { valueAsDate: true })}
              />
              {getErrorMessage('dueDate') && (
                <p className="text-xs text-destructive">
                  {getErrorMessage('dueDate')}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Si aggiorna automaticamente a +30 giorni dalla data di emissione
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Stato</Label>
            <Select 
              value={form.watch("status")} 
              onValueChange={(value: InvoiceStatus) => form.setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Bozza</SelectItem>
                <SelectItem value="SENT">Inviata</SelectItem>
                <SelectItem value="PAID">Pagata</SelectItem>
                <SelectItem value="OVERDUE">Scaduta</SelectItem>
                <SelectItem value="CANCELLED">Annullata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Aliquota IVA (%)</Label>
            <div className="space-y-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Aliquota IVA"
                className={getErrorMessage('taxRate') ? 'border-destructive' : ''}
                {...form.register("taxRate", { valueAsNumber: true })}
              />
              {getErrorMessage('taxRate') && (
                <p className="text-xs text-destructive">
                  {getErrorMessage('taxRate')}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Note</Label>
            <Textarea 
              {...form.register("notes")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Elementi Fattura</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Riga
          </Button>
        </div>

        {/* Header per i campi */}
        {fields.length > 0 && (
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-600 pl-[3px]">Descrizione</Label>
            </div>
            <div className="w-[90px]">
              <Label className="text-sm font-medium text-gray-600 pl-[3px]">Qtà</Label>
            </div>
            <div className="w-[120px]">
              <Label className="text-sm font-medium text-gray-600 pl-[3px]">Prezzo €</Label>
            </div>
            <div className="w-[83px]">
              <Label className="text-sm font-medium text-gray-600 pl-[3px]">IVA %</Label>
            </div>
            <div className="min-w-[120px]">
              {/* Spazio per totale inline e pulsante elimina */}
            </div>
            <div className="w-[40px]">
              {/* Spazio per pulsante elimina */}
            </div>
          </div>
        )}
        
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <div className="space-y-1">
                  <Input
                    placeholder="Descrizione servizio"
                    className={getErrorMessage(`items.${index}.description`) ? 'border-destructive' : ''}
                    {...form.register(`items.${index}.description` as const)}
                  />
                  {getErrorMessage(`items.${index}.description`) && (
                    <p className="text-xs text-destructive">
                      {getErrorMessage(`items.${index}.description`)}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-[90px]">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="0.01"
                    max="9999"
                    step="0.01"
                    placeholder="1"
                    className={getErrorMessage(`items.${index}.quantity`) ? 'border-destructive' : ''}
                    {...form.register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                  {getErrorMessage(`items.${index}.quantity`) && (
                    <p className="text-xs text-destructive">
                      {getErrorMessage(`items.${index}.quantity`)}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-[120px]">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    placeholder="100.00"
                    className={getErrorMessage(`items.${index}.unitPrice`) ? 'border-destructive' : ''}
                    {...form.register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                  />
                  {getErrorMessage(`items.${index}.unitPrice`) && (
                    <p className="text-xs text-destructive">
                      {getErrorMessage(`items.${index}.unitPrice`)}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-[83px]">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="0"
                    max="99.9"
                    step="0.1"
                    placeholder="22"
                    className={getErrorMessage(`items.${index}.taxRate`) ? 'border-destructive' : ''}
                    {...form.register(`items.${index}.taxRate` as const, { valueAsNumber: true })}
                  />
                  {getErrorMessage(`items.${index}.taxRate`) && (
                    <p className="text-xs text-destructive">
                      {getErrorMessage(`items.${index}.taxRate`)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-sm text-gray-600">Totale:</span>
                <span className="font-medium text-green-600 text-sm">
                  €{calculateItemTotal(index)}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        {getErrorMessage('items') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ {getErrorMessage('items')}
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <div className="text-right space-y-3 min-w-[200px]">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm text-gray-600 mb-1">Totale fattura (IVA inclusa)</div>
              <div className="text-2xl font-bold text-green-600">
                €{calculateLiveTotal()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Aggiornato automaticamente
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? "Salvataggio..." : "Salva Fattura"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
