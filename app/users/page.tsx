"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserManager } from "@/components/users/UserManager"
import { AccessDenied } from "@/components/users/AccessDenied"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const router = useRouter()

  // Funzione per recuperare il ruolo dell'utente corrente
  const fetchCurrentUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (!response.ok) throw new Error("Errore nel recupero del profilo utente")
      
      const userData = await response.json()
      setUserRole(userData.role)
      setIsSuperAdmin(userData.role === "superadmin")
      return userData.role
    } catch (error) {
      console.error("Errore nel recupero del ruolo:", error)
      return null
    }
  }

  // Funzione per recuperare tutti gli utenti
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users")
      
      if (!response.ok) {
        if (response.status === 403) {
          // Accesso negato, l'utente non è admin
          setIsLoading(false)
          return []
        }
        throw new Error("Errore nel recupero degli utenti")
      }
      
      const data = await response.json()
      setUsers(data)
      return data
    } catch (error) {
      console.error("Errore nel recupero degli utenti:", error)
      toast.error("Errore nel caricamento degli utenti")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per creare un nuovo utente
  const createUser = async (userData: any) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore nella creazione dell'utente")
      }

      const newUser = await response.json()
      setUsers(prev => [newUser, ...prev])
      toast.success("Utente creato con successo")
      return newUser
    } catch (error: any) {
      console.error("Errore nella creazione dell'utente:", error)
      toast.error(error.message || "Errore nella creazione dell'utente")
      throw error
    }
  }

  // Funzione per aggiornare un utente
  const updateUser = async (id: string, userData: any) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore nell'aggiornamento dell'utente")
      }

      const updatedUser = await response.json()
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user))
      toast.success("Utente aggiornato con successo")
      return updatedUser
    } catch (error: any) {
      console.error("Errore nell'aggiornamento dell'utente:", error)
      toast.error(error.message || "Errore nell'aggiornamento dell'utente")
      throw error
    }
  }

  // Funzione per eliminare un utente
  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Errore nell'eliminazione dell'utente")
      }

      setUsers(prev => prev.filter(user => user.id !== id))
      toast.success("Utente eliminato con successo")
      return true
    } catch (error: any) {
      console.error("Errore nell'eliminazione dell'utente:", error)
      toast.error(error.message || "Errore nell'eliminazione dell'utente")
      return false
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Recupera il ruolo dell'utente e poi gli utenti se è admin
      fetchCurrentUserRole().then(role => {
        // Controllo case-insensitive del ruolo
        const normalizedRole = role?.toLowerCase()
        console.log("Ruolo utente pagina:", role, "Normalizzato:", normalizedRole)
        
        if (normalizedRole === "admin" || normalizedRole === "superadmin") {
          fetchUsers()
        } else {
          setIsLoading(false)
        }
      })
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, session, router])

  // Mostra il loader durante il caricamento
  if (isLoading || status === "loading") {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center flex-col gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xl">Caricamento gestione utenti...</span>
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Recupero dati in corso..." : "Inizializzazione..."}
        </span>
      </div>
    )
  }

  // Verifica se l'utente è admin o superadmin (case-insensitive)
  const normalizedUserRole = userRole?.toLowerCase()
  console.log("Check accesso finale:", userRole, normalizedUserRole)
  const hasAccess = normalizedUserRole === "admin" || normalizedUserRole === "superadmin"

  // Blocca l'accesso se non è admin o superadmin
  if (!hasAccess) {
    return <AccessDenied />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!isSuperAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Informazione</AlertTitle>
            <AlertDescription>
              Alcune funzionalità di gestione utenti richiedono privilegi avanzati. 
              Per accesso completo, contatta un superadmin.
            </AlertDescription>
          </Alert>
        )}
        
        {/* <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestione Utent</h1>
        </div> */}

        <UserManager
          users={users}
          isLoading={isLoading}
          createUser={createUser}
          updateUser={updateUser}
          deleteUser={deleteUser}
          fetchUsers={fetchUsers}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </DashboardLayout>
  )
}
