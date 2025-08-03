"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { Client } from "@/types/client"

interface InvoiceTestFormProps {
  clients: Client[]
}

export function InvoiceTestForm({ clients }: InvoiceTestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🧪 TEST: Form submitted!')
    
    setIsLoading(true)
    
    try {
      // Usa il primo cliente disponibile o un ID di fallback
      const firstClient = clients[0]
      if (!firstClient) {
        throw new Error('Nessun cliente disponibile per il test')
      }
      
      // Dati di test minimi
      const testData = {
        invoiceNumber: `TEST-${Date.now()}`,
        clientId: firstClient.id,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "DRAFT",
        taxRate: 22,
        notes: "Test invoice",
        items: [
          {
            description: "Test item",
            quantity: 1,
            unitPrice: 100,
            taxRate: 22
          }
        ]
      }
      
      console.log('🧪 TEST: Sending data:', JSON.stringify(testData, null, 2))
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })
      
      console.log('🧪 TEST: Response status:', response.status)
      console.log('🧪 TEST: Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('🧪 TEST: Error data:', errorData)
        throw new Error(`API Error: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🧪 TEST: Success!', result)
      
      toast({
        title: "Test riuscito!",
        description: "La fattura di test è stata creata con successo.",
      })
      
    } catch (error) {
      console.error('🧪 TEST: Error:', error)
      toast({
        title: "Test fallito",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-4">🧪 Test Creazione Fattura</h3>
      <p className="text-sm text-gray-600 mb-4">
        Questo form testa la creazione di una fattura con dati hardcoded per identificare il problema.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Cliente per Test</Label>
          <Input value={clients[0]?.name || 'Nessun cliente disponibile'} disabled />
        </div>
        
        <div>
          <Label>Numero Fattura Test</Label>
          <Input value={`TEST-${Date.now()}`} disabled />
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Testando..." : "🧪 Testa Creazione Fattura"}
        </Button>
      </form>
    </div>
  )
}
