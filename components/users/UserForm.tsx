import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

// Schema di validazione per il form utente
const baseSchema = {
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.enum(["user", "admin", "superadmin"]).default("user"),
}

// Schema per nuovo utente (include password obbligatoria)
const newUserSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
})

// Schema per modifica utente (password opzionale)
const editUserSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri").optional(),
})

interface UserFormProps {
  onSubmit: (data: any) => Promise<void>
  isSubmitting: boolean
  isSuperAdmin: boolean
  isNewUser: boolean
  defaultValues?: {
    name?: string
    email?: string
    role?: string
  }
}

export const UserForm = ({
  onSubmit,
  isSubmitting,
  isSuperAdmin,
  isNewUser,
  defaultValues = {}
}: UserFormProps) => {
  // Usa lo schema appropriato in base al tipo di operazione
  const schema = isNewUser ? newUserSchema : editUserSchema
  
  // Inizializza il form
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name || "",
      email: defaultValues.email || "",
      role: (defaultValues.role as "user" | "admin" | "superadmin") || "user",
      password: "",
    },
  })

  // Gestione invio form
  const handleSubmit = async (data: any) => {
    // Rimuovi la password se è vuota (per modifica utente)
    if (!isNewUser && !data.password) {
      delete data.password
    }
    
    await onSubmit(data)
    if (isNewUser) {
      form.reset()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@esempio.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!isSuperAdmin && field.value === "superadmin"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">Utente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isNewUser ? "Password" : "Password (lascia vuoto per non modificare)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isNewUser ? "Nuova password" : "Nuova password (opzionale)"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNewUser ? "Crea Utente" : "Aggiorna Utente"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
