"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, FileText, Clock } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  // Fetch dashboard statistics
  const { data: stats = { clients: 0, projects: 0, invoices: 0, hoursWorked: 0 } } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [clientsRes, projectsRes, invoicesRes, timeEntriesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/projects"),
        fetch("/api/invoices"),
        fetch("/api/time-entries")
      ])

      const clients = clientsRes.ok ? await clientsRes.json() : []
      const projects = projectsRes.ok ? await projectsRes.json() : []
      const invoices = invoicesRes.ok ? await invoicesRes.json() : []
      const timeEntriesData = timeEntriesRes.ok ? await timeEntriesRes.json() : { timeEntries: [] }
      const timeEntries = timeEntriesData.timeEntries || []

      // Calculate hours worked this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthEntries = timeEntries.filter((entry: any) => 
        new Date(entry.startTime) >= startOfMonth
      )
      const hoursWorked = thisMonthEntries.reduce((total: number, entry: any) => 
        total + ((entry.duration || 0) / 60), 0 // Convert minutes to hours
      )

      return {
        clients: clients.length,
        projects: projects.length,
        invoices: invoices.length,
        hoursWorked: Math.round(hoursWorked * 10) / 10 // Round to 1 decimal
      }
    },
    enabled: !!session?.user?.id
  })

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const activities = []
      
      try {
        // Get recent tasks
        const tasksRes = await fetch("/api/tasks")
        if (tasksRes.ok) {
          const tasks = await tasksRes.json()
          const recentTasks = tasks
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .map((task: any) => ({
              id: task.id,
              type: "task",
              title: `Task creato: ${task.title}`,
              date: task.createdAt,
              icon: Clock
            }))
          activities.push(...recentTasks)
        }

        // Get recent time entries
        const timeEntriesRes = await fetch("/api/time-entries")
        if (timeEntriesRes.ok) {
          const timeEntriesData = await timeEntriesRes.json()
          const timeEntries = timeEntriesData.timeEntries || []
          const recentEntries = timeEntries
            .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, 2)
            .map((entry: any) => ({
              id: entry.id,
              type: "time-entry",
              title: `${Math.round(entry.duration / 60 * 10) / 10}h registrate - ${entry.description || 'Lavoro'}`,
              date: entry.startTime,
              icon: Clock
            }))
          activities.push(...recentEntries)
        }

        // Get recent clients
        const clientsRes = await fetch("/api/clients")
        if (clientsRes.ok) {
          const clients = await clientsRes.json()
          const recentClients = clients
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2)
            .map((client: any) => ({
              id: client.id,
              type: "client",
              title: `Nuovo cliente: ${client.name}`,
              date: client.createdAt,
              icon: Users
            }))
          activities.push(...recentClients)
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error)
      }

      // Sort all activities by date and take the most recent 5
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    },
    enabled: !!session?.user?.id
  })

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
              <div className="text-2xl font-bold">{stats.clients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.clients === 0 ? "Nessun cliente ancora" : 
                 stats.clients === 1 ? "1 cliente registrato" : 
                 `${stats.clients} clienti registrati`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progetti Attivi</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.projects === 0 ? "Nessun progetto attivo" : 
                 stats.projects === 1 ? "1 progetto attivo" : 
                 `${stats.projects} progetti attivi`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fatture</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.invoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.invoices === 0 ? "Nessuna fattura" : 
                 stats.invoices === 1 ? "1 fattura emessa" : 
                 `${stats.invoices} fatture emesse`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ore Lavorate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hoursWorked}h</div>
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
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Nessuna attività recente</p>
                  <p className="text-sm">Inizia creando il tuo primo cliente o progetto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity: any) => {
                    const IconComponent = activity.icon
                    return (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(activity.date), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  )
}
