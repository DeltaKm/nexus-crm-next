"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface AddInvoiceDialogProps {
  clients: Client[]
  projects: Project[]
  onInvoiceCreated?: () => void
}

export function AddInvoiceDialog({
  clients,
  projects,
  onInvoiceCreated,
}: AddInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || "Errore durante la creazione della fattura"
        )
      }

      toast({
        title: "Fattura creata",
        description: "La fattura è stata creata con successo",
      })
      
      setOpen(false)
      router.refresh()
      
      if (onInvoiceCreated) {
        onInvoiceCreated()
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Fattura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuova Fattura</DialogTitle>
          <DialogDescription>
            Compila il form per creare una nuova fattura.
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm
          clients={clients}
          projects={projects}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
