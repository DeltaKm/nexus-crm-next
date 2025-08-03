"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Pencil, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditInvoiceDialog } from "./EditInvoiceDialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import type { Client } from "@/types/client"
import type { Project } from "@/types/project"

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
  client: Client
  project?: Project | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
  }>
  sender: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface InvoiceDetailsDialogProps {
  invoice: Invoice
  clients: Client[]
  projects: Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceDeleted?: () => void
  onInvoiceUpdated?: () => void
}

export function InvoiceDetailsDialog({
  invoice,
  clients,
  projects,
  open,
  onOpenChange,
  onInvoiceDeleted,
  onInvoiceUpdated,
}: InvoiceDetailsDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Funzione per gestire l'eliminazione della fattura
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione della fattura")
      }

      onOpenChange(false)
      
      if (onInvoiceDeleted) {
        onInvoiceDeleted()
      }
    } catch (error) {
      console.error("Errore durante l'eliminazione della fattura:", error)
    }
  }

  // Funzione per ottenere il colore del badge in base allo stato
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Bozza</Badge>
      case "SENT":
        return <Badge variant="secondary">Inviata</Badge>
      case "PAID":
        return <Badge variant="success">Pagata</Badge>
      case "OVERDUE":
        return <Badge variant="destructive">Scaduta</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Annullata</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calcola il totale della fattura
  const calculateTotal = () => {
    return invoice.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice
      const tax = itemTotal * (item.taxRate / 100)
      return total + itemTotal + tax
    }, 0)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl">
              Fattura #{invoice.invoiceNumber}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <ConfirmDialog
                title="Elimina Fattura"
                description="Sei sicuro di voler eliminare questa fattura? Questa azione non può essere annullata."
                onConfirm={handleDelete}
                trigger={
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
              <DialogClose asChild>
                <Button variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Dettagli Fattura</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numero:</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stato:</span>
                    <span>{getStatusBadge(invoice.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Emissione:</span>
                    <span>{format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: it })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Scadenza:</span>
                    <span>{format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: it })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aliquota IVA:</span>
                    <span>{invoice.taxRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creata il:</span>
                    <span>{format(new Date(invoice.createdAt), "dd/MM/yyyy", { locale: it })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Cliente e Progetto</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">
                      {invoice.client.name} {invoice.client.company && `(${invoice.client.company})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progetto:</span>
                    <span>{invoice.project ? invoice.project.name : "Nessun progetto"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emessa da:</span>
                    <span>{invoice.sender.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Elementi Fattura */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Elementi Fattura</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="w-[100px] text-right">Quantità</TableHead>
                    <TableHead className="w-[120px] text-right">Prezzo</TableHead>
                    <TableHead className="w-[80px] text-right">IVA %</TableHead>
                    <TableHead className="w-[120px] text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.taxRate}%</TableCell>
                      <TableCell className="text-right">
                        €{((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toFixed(2)}
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
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Note */}
          {invoice.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Note</h3>
              <div className="border rounded-md p-4 bg-muted/30">
                {invoice.notes}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog di modifica */}
      <EditInvoiceDialog
        invoice={invoice}
        clients={clients}
        projects={projects}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onInvoiceUpdated={() => {
          if (onInvoiceUpdated) {
            onInvoiceUpdated()
          }
        }}
      />
    </>
  )
}
