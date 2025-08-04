"use client"

import { useState } from "react"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { it } from "date-fns/locale"
import { useQuery } from "@tanstack/react-query"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ListTodo,
  Clock
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type CalendarView = "day" | "week" | "month"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "task" | "deadline" | "meeting"
  status?: string
  priority?: string
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const today = new Date()

  // Query per i task
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei task")
      }
      return response.json()
    },
  })

  // Query per i progetti (per eventuali deadline)
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei progetti")
      }
      return response.json()
    },
  })

  // Funzioni di navigazione
  const navigateToPrevious = () => {
    switch (view) {
      case "day":
        setSelectedDate(addDays(selectedDate, -1))
        break
      case "week":
        setSelectedDate(addDays(selectedDate, -7))
        break
      case "month":
        const prevMonth = new Date(selectedDate)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        setSelectedDate(prevMonth)
        break
    }
  }

  const navigateToNext = () => {
    switch (view) {
      case "day":
        setSelectedDate(addDays(selectedDate, 1))
        break
      case "week":
        setSelectedDate(addDays(selectedDate, 7))
        break
      case "month":
        const nextMonth = new Date(selectedDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setSelectedDate(nextMonth)
        break
    }
  }

  const navigateToToday = () => {
    setSelectedDate(new Date())
  }

  // Formatta il range di date in base alla vista
  const formatDateRange = () => {
    switch (view) {
      case "day":
        return format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })
      case "week": {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
        return `${format(start, "d", { locale: it })} - ${format(end, "d MMMM yyyy", { locale: it })}`
      }
      case "month":
        return format(selectedDate, "MMMM yyyy", { locale: it })
    }
  }

  // Prepara gli eventi del calendario dai task
  const getCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    // Aggiungi task con due date
    tasks.forEach((task) => {
      if (task.dueDate) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          date: new Date(task.dueDate),
          type: "task",
          status: task.status,
          priority: task.priority,
        })
      }
    })

    // Aggiungi progetti con date di scadenza
    projects.forEach((project) => {
      if (project.endDate) {
        events.push({
          id: `project-${project.id}`,
          title: `Scadenza: ${project.name}`,
          date: new Date(project.endDate),
          type: "deadline",
          status: project.status,
        })
      }
    })

    return events
  }

  const events = getCalendarEvents()

  // Filtra eventi per la vista corrente
  const getEventsForCurrentView = () => {
    let start: Date, end: Date
    
    switch (view) {
      case "day":
        start = selectedDate
        end = selectedDate
        break
      case "week":
        start = startOfWeek(selectedDate, { weekStartsOn: 1 })
        end = endOfWeek(selectedDate, { weekStartsOn: 1 })
        break
      case "month":
        start = startOfMonth(selectedDate)
        end = endOfMonth(selectedDate)
        break
    }

    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= start && eventDate <= end
    })
  }

  const currentEvents = getEventsForCurrentView()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">
              Visualizza e gestisci i tuoi eventi, task e scadenze
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Evento
          </Button>
        </div>

        {/* Navigation Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={navigateToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={navigateToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={navigateToToday}>
                  Oggi
                </Button>
              </div>
              
              <CardTitle className="text-xl">
                {formatDateRange()}
              </CardTitle>

              <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
                <TabsList>
                  <TabsTrigger value="day">Giorno</TabsTrigger>
                  <TabsTrigger value="week">Settimana</TabsTrigger>
                  <TabsTrigger value="month">Mese</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {view === "month" && (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={it}
                    className="w-full"
                  />
                )}
                
                {view === "week" && (
                  <div className="space-y-4">
                    <div className="text-center text-lg font-semibold">
                      Vista Settimanale
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
                        const dayEvents = events.filter(event => 
                          format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                        )
                        
                        return (
                          <div key={i} className="border rounded-lg p-2 min-h-[120px]">
                            <div className="font-medium text-sm mb-2">
                              {format(date, 'EEE d', { locale: it })}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "text-xs p-1 rounded truncate",
                                    event.type === "task" && "bg-blue-100 text-blue-800",
                                    event.type === "deadline" && "bg-red-100 text-red-800",
                                    event.type === "meeting" && "bg-green-100 text-green-800"
                                  )}
                                >
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {view === "day" && (
                  <div className="space-y-4">
                    <div className="text-center text-lg font-semibold">
                      {format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })}
                    </div>
                    <div className="space-y-2">
                      {currentEvents.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          Nessun evento per questo giorno
                        </div>
                      ) : (
                        currentEvents.map((event) => (
                          <Card key={event.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {event.type === "task" && <ListTodo className="h-4 w-4 text-blue-600" />}
                                  {event.type === "deadline" && <Clock className="h-4 w-4 text-red-600" />}
                                  {event.type === "meeting" && <CalendarIcon className="h-4 w-4 text-green-600" />}
                                  <div>
                                    <div className="font-medium">{event.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(event.date, "HH:mm", { locale: it })}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {event.priority && (
                                    <Badge variant={
                                      event.priority === "HIGH" ? "destructive" :
                                      event.priority === "MEDIUM" ? "default" : "secondary"
                                    }>
                                      {event.priority}
                                    </Badge>
                                  )}
                                  {event.status && (
                                    <Badge variant="outline">
                                      {event.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Mini Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Navigazione Rapida</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={it}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Events Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Eventi Prossimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      {event.type === "task" && <ListTodo className="h-3 w-3 text-blue-600" />}
                      {event.type === "deadline" && <Clock className="h-3 w-3 text-red-600" />}
                      {event.type === "meeting" && <CalendarIcon className="h-3 w-3 text-green-600" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(event.date, "d MMM", { locale: it })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentEvents.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Nessun evento in programma
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistiche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task totali</span>
                    <span className="font-medium">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Progetti attivi</span>
                    <span className="font-medium">
                      {projects.filter(p => p.status === 'ACTIVE').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Eventi questo mese</span>
                    <span className="font-medium">{currentEvents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
