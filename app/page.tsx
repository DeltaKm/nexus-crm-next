"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, FileText, Clock } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <DashboardLayout>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Benvenuto, {session?.user?.name || 'Utente'}!
          </h2>
          <p className="text-gray-600">
            Gestisci i tuoi clienti, progetti e attività dal tuo dashboard.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nessun cliente ancora
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progetti Attivi</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nessun progetto attivo
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fatture</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nessuna fattura
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ore Lavorate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0h</div>
              <p className="text-xs text-muted-foreground">
                Questo mese
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
              <CardDescription>
                Inizia subito a gestire il tuo CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push("/clients")}
              >
                <Users className="mr-2 h-4 w-4" />
                Gestisci Clienti
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Gestisci Progetti
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push("/tasks")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Gestisci Task
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Nuova Fattura
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
              <CardDescription>
                Le tue ultime azioni nel sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Nessuna attività recente</p>
                <p className="text-sm">Inizia creando il tuo primo cliente o progetto</p>
              </div>
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  )
}
