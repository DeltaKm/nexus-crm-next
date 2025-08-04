"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Import shared types and form values
import type { Client } from "@/types/client"
import type { Project } from "@/types/project"
import { 
  invoiceSchema,
  InvoiceFormWithItems,
  InvoiceStatus,
  invoiceFormSchema, 
  invoiceItemFormSchema, 
  type InvoiceFormValues, 
  type InvoiceItemFormValues 
} from "@/lib/validations/invoice"

// Import components
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InvoiceForm } from "./InvoiceForm"
import { useToast } from "@/components/ui/use-toast"

// Generate next invoice number
const generateNextInvoiceNumber = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `FATT-${year}${month}-${randomNum}`
}

// Use the imported type from validations

export interface AddInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  projects: Project[]
  onInvoiceCreated?: () => void
  defaultValues?: Partial<InvoiceFormWithItems>
  children?: React.ReactNode
}

export function AddInvoiceDialog({
  open,
  onOpenChange,
  clients,
  projects,
  onInvoiceCreated,
  defaultValues,
  children,
}: AddInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const form = useForm<InvoiceFormWithItems>({
    resolver: zodResolver(invoiceSchema as any), // Use invoiceSchema to include items validation
    defaultValues: {
      invoiceNumber: generateNextInvoiceNumber(),
      clientId: '',
      projectId: undefined,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'DRAFT',
      taxRate: 22,
      notes: '',
      items: [], // Start with empty array, user will add items manually
      ...defaultValues,
    },
  })
  
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (formData: InvoiceFormWithItems) => {
    setIsLoading(true)
    setFormErrors({})
    setApiError(null)
    
    try {
      // Validate form data against the schema
      const validationResult = invoiceSchema.safeParse(formData)
      
      if (!validationResult.success) {
        
        // Convert Zod errors to a more usable format
        const errors: Record<string, string> = {}
        validationResult.error.issues.forEach((issue) => {
          const path = issue.path.join('.')
          errors[path] = issue.message
        })
        setFormErrors(errors)
        
        // Show the first error in a toast
        const firstError = validationResult.error.issues[0]
        if (firstError) {
          toast({
            title: "Errore di validazione",
            description: `${firstError.path.join('.')}: ${firstError.message}`,
            variant: "destructive"
          })
        }
        
        return
      }
      
      // Map items to match the expected format
      const itemsWithAmounts = (formData.items || []).map(item => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 22,
        timeEntryId: item.timeEntryId || null,
      }))

      // Calculate total amount with proper type safety
      const subtotal = itemsWithAmounts.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)

      const taxAmount = itemsWithAmounts.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unitPrice
        return sum + (itemSubtotal * (item.taxRate / 100))
      }, 0)

      const total = subtotal + taxAmount

      // Prepare invoice data for submission
      // Create invoice data with proper types
      const invoiceData = {
        ...formData,
        items: itemsWithAmounts,
        subtotal,
        taxAmount,
        total,
        status: formData.status as InvoiceStatus,
        client: clients.find(c => c.id === formData.clientId),
        project: projects.find(p => p.id === formData.projectId),
      }

      // Prepare the request data
      const requestData = {
        ...formData,
        items: itemsWithAmounts,
        amount: total,
        subtotal,
        taxAmount,
        // Ensure dates are properly formatted as ISO strings
        issueDate: formData.issueDate?.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
      }
      
      console.log('✅ Client-side validation passed')
      console.log('📤 Sending invoice data:', JSON.stringify(requestData, null, 2))
      
      // Send data to the API
      console.log('🌐 Making API request to /api/invoices...')
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      
      console.log('📨 API Response status:', response.status)
      console.log('📨 API Response ok:', response.ok)

      if (!response.ok) {
        console.log('❌ API request failed with status:', response.status)
        let errorMessage = 'Errore durante il salvataggio della fattura'
        
        try {
          const errorData = await response.json()
          console.error('❌ API Error details:', errorData)
          
          if (response.status === 409) {
            // Duplicate invoice number
            errorMessage = errorData.message || 'Numero fattura già esistente'
            // Set form error for invoice number field
            form.setError('invoiceNumber', { message: errorMessage })
          } else {
            errorMessage = errorData.error || errorData.message || "Errore durante la creazione della fattura"
          }
        } catch (error) {
          console.error('❌ Error parsing API error response:', error)
        }
        
        // Show error toast
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive"
        })
        
        return // Don't throw, just return to show the error
      }

      const result = await response.json()
      // Show success message with proper type checking
      toast({
        title: "Fattura creata",
        description: `La fattura ${formData.invoiceNumber || ''} è stata creata con successo.`,
      })

      onOpenChange(false)
      router.refresh()
      if (onInvoiceCreated) {
        onInvoiceCreated()
      }
    } catch (error) {
      console.error("Errore durante la creazione della fattura:", error)
      
      // Only show generic error if we haven't shown a more specific one
      if (!apiError) {
        toast({
          title: "Errore",
          description: error instanceof Error ? error.message : "Si è verificato un errore durante la creazione della fattura.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filter projects based on clientId
  const getClientProjects = (clientId: string) => {
    if (!clientId) return []
    return projects.filter(project => project.clientId === clientId)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Crea nuova fattura</DialogTitle>
          <DialogDescription>
            Compila i dettagli della fattura. Clicca su salva quando hai finito.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {apiError && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <p className="font-medium">Errore durante il salvataggio:</p>
              <p className="text-sm">{apiError}</p>
            </div>
          )}
          
          <InvoiceForm
            form={form}
            clients={clients}
            projects={projects}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
            formErrors={formErrors}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
