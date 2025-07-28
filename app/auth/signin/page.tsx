"use client"

import React, { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, LockKeyhole, UserPlus, Mail, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().min(1, "L'email è richiesta"),
  password: z.string().min(1, "La password è richiesta"),
})

const registerSchema = z.object({
  fullName: z.string().min(2, "Il nome completo è richiesto"),
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("login")
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  })

  // Controlla se ci sono già utenti nel sistema
  useEffect(() => {
    const checkIfFirstUser = async () => {
      try {
        const response = await fetch('/api/auth/check-first-user')
        const data = await response.json()
        setIsFirstUser(data.isFirstUser)
      } catch (error) {
        console.error("Error checking if first user:", error)
        setIsFirstUser(null)
      }
    }
    
    checkIfFirstUser()
  }, [])

  // Reset form errors when switching tabs
  useEffect(() => {
    setAuthError(null)
    if (activeTab === "login") {
      loginForm.reset()
    } else {
      registerForm.reset()
    }
  }, [activeTab, loginForm, registerForm])

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setAuthError(null)
    
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        setAuthError("Email o password non corretti")
        toast.error("Errore di accesso", {
          description: "Email o password non corretti"
        })
      } else {
        toast.success("Accesso effettuato con successo!")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthError("Errore durante l'accesso")
      toast.error("Errore durante l'accesso")
    } finally {
      setIsLoading(false)
    }
  }

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setAuthError(null)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || "Errore durante la registrazione")
        toast.error("Errore di registrazione", {
          description: data.error || "Errore durante la registrazione"
        })
        return
      }

      // Registrazione riuscita
      toast.success("Registrazione completata!", {
        description: data.message
      })

      // Auto-login dopo registrazione
      const loginResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (loginResult?.error) {
        // Se auto-login fallisce, passa al tab login
        setActiveTab("login")
        toast.info("Registrazione completata", {
          description: "Ora puoi effettuare l'accesso"
        })
      } else {
        router.push("/")
        router.refresh()
      }

    } catch (error) {
      console.error("Registration error:", error)
      setAuthError("Errore durante la registrazione")
      toast.error("Errore durante la registrazione")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexus CRM</h1>
          <p className="text-gray-600">Gestisci i tuoi clienti e progetti</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Accedi
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Registrati
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="w-5 h-5" />
                  Accedi al tuo account
                </CardTitle>
                <CardDescription>
                  Inserisci le tue credenziali per accedere
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nome@esempio.com"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {authError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {authError}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Accesso in corso..." : "Accedi"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Crea un nuovo account
                </CardTitle>
                <CardDescription>
                  Compila i campi per registrarti
                </CardDescription>
                {isFirstUser && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
                    <Info className="w-4 h-4" />
                    Sarai il primo utente e avrai privilegi di amministratore
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mario Rossi"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nome@esempio.com"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {authError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {authError}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Registrazione in corso..." : "Registrati"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
