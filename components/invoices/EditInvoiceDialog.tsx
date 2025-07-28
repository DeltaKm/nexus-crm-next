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
import { InvoiceForm } from "./InvoiceForm"
import { toast } from "@/components/ui/use-toast"

interface Client {
  id: string
  name: string
  company?: string | null
}

interface Project {
  id: string
  name: string
}

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
        description: "La fattura è stata aggiornata con successo",
      })
      
      onOpenChange(false)
      router.refresh()
      
      if (onInvoiceUpdated) {
        onInvoiceUpdated()
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
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
          defaultValues={{
            ...invoice,
            issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date()
          }}
          clients={clients}
          projects={projects}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
