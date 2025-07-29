"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Minimal interfaces for TypeScript
type Client = { id: string; name: string; company?: string | null }
type Project = { id: string; name: string }
type Invoice = {
  id: string; invoiceNumber: string; client: Client; project?: Project | null;
  status: string; issueDate: string; dueDate: string; items: Array<{
    id: string; quantity: number; unitPrice: number; taxRate: number;
  }>
}

function InvoicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams()
        const status = searchParams?.get("status")
        if (status) params.append("status", status)
        
        const res = await fetch(`/api/invoices?${params.toString()}`)
        if (!res.ok) throw new Error("Error loading invoices")
        const data = await res.json()
        setInvoices(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [searchParams])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fatture</h1>
        <Button>Nuova Fattura</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Elenco fatture</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border p-4 rounded-lg">
                  <div className="font-medium">Fattura #{invoice.invoiceNumber}</div>
                  <div>Cliente: {invoice.client.name}</div>
                  <div>Stato: {invoice.status}</div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna fattura trovata
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <InvoicesContent />
      </Suspense>
    </DashboardLayout>
  )
}
