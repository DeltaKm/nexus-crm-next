import React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AccessDenied() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold">Accesso Negato</h1>
      <p className="text-muted-foreground max-w-md">
        Non hai i permessi necessari per accedere a questa sezione. 
        Solo gli amministratori possono gestire gli utenti del sistema.
      </p>
      <Button onClick={() => router.push("/dashboard")}>
        Torna alla Dashboard
      </Button>
    </div>
  )
}
