import React, { useState, useRef } from "react"
import { UserTable } from "@/components/users/UserTable"
import { UserToolbar } from "@/components/users/UserToolbar"
import { UserDialogManager } from "@/components/users/UserDialogManager"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

interface UserManagerProps {
  users: User[]
  isLoading: boolean
  isSuperAdmin: boolean
  createUser: (userData: {
    name: string
    email: string
    role: string
    password: string
  }) => Promise<any>
  updateUser: (id: string, userData: {
    name?: string
    email?: string
    role?: string
    password?: string
  }) => Promise<any>
  deleteUser: (id: string) => Promise<boolean>
  fetchUsers: () => Promise<void>
}

export const UserManager = ({ 
  users, 
  isLoading,
  isSuperAdmin,
  createUser,
  updateUser,
  deleteUser,
  fetchUsers
}: UserManagerProps) => {
  const [refreshing, setRefreshing] = useState(false)
  const [filterValue, setFilterValue] = useState("")
  const dialogManagerRef = useRef<any>(null)
  
  // Gestione eliminazione utente
  const handleDeleteUser = async (user: User) => {
    try {
      const success = await deleteUser(user.id)
      
      if (!success) {
        toast.error("Non è stato possibile eliminare questo utente")
      }
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'utente:", error)
    }
  }

  // Gestione aggiornamento utente
  const handleUpdateUser = async (id: string, userData: any) => {
    try {
      await updateUser(id, userData)
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'utente:", error)
    }
  }

  // Gestione refresh della lista utenti
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchUsers()
    } finally {
      setRefreshing(false)
    }
  }

  // Filtra gli utenti in base alla ricerca
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(filterValue.toLowerCase()) || 
    user.email.toLowerCase().includes(filterValue.toLowerCase()) ||
    user.role.toLowerCase().includes(filterValue.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <UserToolbar 
        onRefresh={handleRefresh} 
        refreshing={refreshing}
        onAddUser={() => dialogManagerRef.current?.openAddDialog()}
        onFilterChange={setFilterValue}
        filterValue={filterValue}
      />
      
      <UserTable 
        users={filteredUsers} 
        isLoading={isLoading}
        onEdit={(user) => dialogManagerRef.current?.openEditDialog(user)}
        onDelete={handleDeleteUser}
        isSuperAdmin={isSuperAdmin}
      />
      
      <UserDialogManager
        ref={dialogManagerRef}
        onCreateUser={createUser}
        onUpdateUser={handleUpdateUser}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
