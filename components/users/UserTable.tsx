import React from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Edit, Trash2, Shield, User as UserIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

interface UserTableProps {
  users: User[]
  isLoading: boolean
  isSuperAdmin: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export const UserTable = ({ 
  users, 
  isLoading, 
  isSuperAdmin,
  onEdit, 
  onDelete 
}: UserTableProps) => {
  // Funzione per ottenere il badge del ruolo
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Badge className="bg-purple-600 hover:bg-purple-700">Super Admin</Badge>
      case "admin":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Admin</Badge>
      default:
        return <Badge variant="outline">Utente</Badge>
    }
  }

  // Funzione per ottenere l'icona del ruolo
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
      case "admin":
        return <Shield className="h-4 w-4 text-primary" />
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Se non ci sono utenti, mostra un messaggio
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
        <UserIcon className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Nessun utente trovato</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading 
            ? "Caricamento utenti in corso..." 
            : "Non ci sono utenti registrati o corrispondenti ai filtri."}
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ruolo</TableHead>
            <TableHead>Registrato il</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  {getRoleBadge(user.role)}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(user.createdAt), "dd MMM yyyy", { locale: it })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Modifica</span>
                  </Button>
                  
                  <ConfirmDialog
                    title="Elimina utente"
                    description={`Sei sicuro di voler eliminare l'utente ${user.name}? Questa azione non può essere annullata.`}
                    onConfirm={() => onDelete(user)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={user.role?.toLowerCase() === "superadmin" && !isSuperAdmin}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Elimina</span>
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
