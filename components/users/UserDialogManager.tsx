import React, { forwardRef, useImperativeHandle, useState } from "react"
import { UserForm } from "@/components/users/UserForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserDialogManagerProps {
  onCreateUser: (userData: any) => Promise<any>
  onUpdateUser: (id: string, userData: any) => Promise<any>
  isSuperAdmin: boolean
}

export const UserDialogManager = forwardRef(({ 
  onCreateUser, 
  onUpdateUser,
  isSuperAdmin
}: UserDialogManagerProps, ref) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Espone metodi al componente padre
  useImperativeHandle(ref, () => ({
    openAddDialog: () => {
      setIsAddDialogOpen(true)
    },
    openEditDialog: (user: User) => {
      setCurrentUser(user)
      setIsEditDialogOpen(true)
    }
  }))

  // Gestione creazione utente
  const handleCreateUser = async (data: any) => {
    setIsSubmitting(true)
    try {
      await onCreateUser(data)
      setIsAddDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gestione aggiornamento utente
  const handleUpdateUser = async (data: any) => {
    if (!currentUser) return
    
    setIsSubmitting(true)
    try {
      await onUpdateUser(currentUser.id, data)
      setIsEditDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Dialog per aggiungere un nuovo utente */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Utente</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli per creare un nuovo utente nel sistema.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            onSubmit={handleCreateUser}
            isSubmitting={isSubmitting}
            isSuperAdmin={isSuperAdmin}
            isNewUser={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog per modificare un utente esistente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell&apos;utente.
            </DialogDescription>
          </DialogHeader>
          
          {currentUser && (
            <UserForm 
              onSubmit={handleUpdateUser}
              isSubmitting={isSubmitting}
              isSuperAdmin={isSuperAdmin}
              isNewUser={false}
              defaultValues={{
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
})

UserDialogManager.displayName = "UserDialogManager"
