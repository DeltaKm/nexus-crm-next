"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InvoiceForm, useInvoiceForm } from "./InvoiceForm"
import { toast } from "@/components/ui/use-toast"
import type { Client } from "@/types/client"
import type { Project } from "@/types/project"
import { InvoiceStatus } from "@/lib/validations/invoice"

// Import the Invoice type if it's defined elsewhere
// Otherwise, define it here with all required fields
interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  taxRate: number
  notes?: string | null
  clientId: string
  projectId?: string | null
  items: any[]
  [key: string]: any
}

interface EditInvoiceDialogProps {
  invoice: Invoice
  clients: Client[]
  projects: Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceUpdated?: () => void
}

export function EditInvoiceDialog({
  invoice,
  clients,
  projects,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: EditInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  // Initialize form with default values from the invoice
  const form = useInvoiceForm({
    ...invoice,
    issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
    status: invoice.status as InvoiceStatus,
    items: invoice.items || []
  })

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invoice.id,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || "Errore durante l'aggiornamento della fattura"
        )
      }

      toast({
        title: "Fattura aggiornata",
        description: "La fattura è stata aggiornata con successo.",
      })
      
      onInvoiceUpdated?.()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento della fattura.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Fattura</DialogTitle>
          <DialogDescription>
            Modifica i dettagli della fattura.
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm
          form={form}
          clients={clients}
          projects={projects}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
