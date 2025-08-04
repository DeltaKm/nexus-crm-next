"use client"

import { useState } from "react"
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import CalendarDayView from "@/components/calendar/CalendarDayView"
import CalendarWeekView from "@/components/calendar/CalendarWeekView"
import CalendarMonthView from "@/components/calendar/CalendarMonthView"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { AddEventDialog } from "@/components/calendar/AddEventDialog"

type CalendarView = "day" | "week" | "month"

interface Event {
  id: string
  title: string
  date: Date
  type: "task" | "deadline" | "meeting"
  priority?: "low" | "medium" | "high"
  amount?: number
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [eventType, setEventType] = useState<"deadline" | "task" | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<any>(null)

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

  // Query per i progetti
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

  // Converti task e progetti in eventi per il calendario
  const events: Event[] = [
    // Task con scadenza
    ...tasks
      .filter(task => task.dueDate)
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        date: new Date(task.dueDate),
        type: "task" as const,
        priority: task.priority as "low" | "medium" | "high" | undefined,
      })),
    // Progetti con scadenza
    ...projects
      .filter(project => project.endDate)
      .map(project => ({
        id: `project-${project.id}`,
        title: `Progetto: ${project.name}`,
        date: new Date(project.endDate),
        type: "deadline" as const,
      })),
  ]

  // Navigazione
  const navigateToPrevious = () => {
    switch (view) {
      case "day":
        setSelectedDate(subDays(selectedDate, 1))
        break
      case "week":
        setSelectedDate(subWeeks(selectedDate, 1))
        break
      case "month":
        setSelectedDate(subMonths(selectedDate, 1))
        break
    }
  }

  const navigateToNext = () => {
    switch (view) {
      case "day":
        setSelectedDate(addDays(selectedDate, 1))
        break
      case "week":
        setSelectedDate(addWeeks(selectedDate, 1))
        break
      case "month":
        setSelectedDate(addMonths(selectedDate, 1))
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

  // Event handlers
  const handleAddEvent = (type: "deadline" | "task") => {
    setEventType(type)
    setIsAddEventDialogOpen(true)
    console.log(`Aggiungi ${type === "deadline" ? "scadenza" : "task"} per il ${format(selectedDate, "dd/MM/yyyy", { locale: it })}`)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsEventDetailsOpen(true)
    console.log('Evento selezionato:', event)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    // Se il giorno ha eventi, mostra il primo evento
    const dayEvents = events.filter(event => 
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    if (dayEvents.length > 0) {
      handleEventClick(dayEvents[0])
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Calendario</h1>
            <p className="text-muted-foreground">
              Visualizza e gestisci scadenze e task
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEventType("deadline")
                setIsAddEventDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Scadenza
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEventType("task")
                setIsAddEventDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Task
            </Button>
          </div>
        </div>

        {/* Main Calendar Card */}
        <Card className="p-4">
          {/* Navigation and Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigateToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={navigateToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={navigateToToday}>
                Oggi
              </Button>
              <h2 className="text-xl font-semibold">{formatDateRange()}</h2>
            </div>

            <div className="flex gap-2">
              <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
                <TabsList>
                  <TabsTrigger value="day">Giorno</TabsTrigger>
                  <TabsTrigger value="week">Settimana</TabsTrigger>
                  <TabsTrigger value="month">Mese</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Calendar Grid Layout - Following Original Structure */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Main Calendar View */}
            <div className="md:col-span-4">
              <Tabs value={view} className="w-full">
                <TabsContent value="day" className="mt-0">
                  <CalendarDayView 
                    date={selectedDate}
                    events={currentEvents}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>
                
                <TabsContent value="week" className="mt-0">
                  <CalendarWeekView 
                    date={selectedDate}
                    events={currentEvents}
                    onSelectDate={handleDayClick}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>
                
                <TabsContent value="month" className="mt-0">
                  <CalendarMonthView 
                    date={selectedDate}
                    events={currentEvents}
                    onSelectDate={handleDayClick}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1 space-y-4">
              {/* Mini Calendar - Custom Simple Implementation */}
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-sm mb-3 text-foreground">Navigazione Rapida</h3>
                <div className="bg-background border rounded-md p-3">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      {format(selectedDate, "MMMM yyyy", { locale: it })}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
                      <div key={i} className="text-xs text-muted-foreground text-center font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(selectedDate)
                      const monthEnd = endOfMonth(selectedDate)
                      const startDay = startOfWeek(monthStart, { weekStartsOn: 1 })
                      const endDay = endOfWeek(monthEnd, { weekStartsOn: 1 })
                      
                      const days = []
                      let day = startDay
                      
                      while (day <= endDay) {
                        days.push(new Date(day))
                        day = addDays(day, 1)
                      }
                      
                      return days.map((day, i) => {
                        const isCurrentMonth = format(day, 'MM') === format(selectedDate, 'MM')
                        const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "h-8 w-8 text-xs rounded-md hover:bg-accent transition-colors",
                              !isCurrentMonth && "text-muted-foreground opacity-50",
                              isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                              isToday && !isSelected && "bg-accent text-accent-foreground font-medium"
                            )}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })
                    })()
                    }
                  </div>
                </div>
              </div>
              
              {/* Events of Selected Day - Following Original Structure */}
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-sm mb-3 text-foreground">Eventi del giorno</h3>
                <div className="text-xs text-muted-foreground mb-2">
                  {format(selectedDate, "EEEE, d MMMM", { locale: it })}
                </div>
                <div className="space-y-2">
                  {(() => {
                    const dayEvents = events.filter(event => 
                      format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    )
                    
                    if (dayEvents.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">Nessun evento per oggi</p>
                        </div>
                      )
                    }
                    
                    return dayEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className={cn(
                          "flex items-start gap-3 text-sm p-3 rounded-lg cursor-pointer transition-colors",
                          event.type === "deadline" ? "bg-red-50 hover:bg-red-100 border border-red-200" :
                          event.type === "task" && event.priority === "high" ? "bg-red-50 hover:bg-red-100 border border-red-200" :
                          event.type === "task" && event.priority === "medium" ? "bg-amber-50 hover:bg-amber-100 border border-amber-200" :
                          event.type === "task" ? "bg-green-50 hover:bg-green-100 border border-green-200" :
                          "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        )}
                        onClick={() => handleEventClick(event)}
                      >
                        {event.type === "task" && <ListTodo className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                        {event.type === "deadline" && <Clock className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                        {event.type === "meeting" && <CalendarIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{event.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {format(event.date, "HH:mm", { locale: it })}
                            </p>
                            {event.amount && (
                              <p className="text-xs font-medium text-primary">
                                €{event.amount}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Add Event Dialog */}
        <AddEventDialog
          open={isAddEventDialogOpen}
          onOpenChange={setIsAddEventDialogOpen}
          selectedDate={selectedDate}
          initialType={eventType || "deadline"}
        />

        {/* Event Details Dialog */}
        <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dettagli Evento</DialogTitle>
              <DialogDescription>
                {selectedEvent && format(selectedEvent.date, "EEEE, dd MMMM yyyy 'alle' HH:mm", { locale: it })}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  {selectedEvent.type === "task" && <ListTodo className="h-5 w-5 text-blue-600" />}
                  {selectedEvent.type === "deadline" && <Clock className="h-5 w-5 text-red-600" />}
                  {selectedEvent.type === "meeting" && <CalendarIcon className="h-5 w-5 text-green-600" />}
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedEvent.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={selectedEvent.type === "deadline" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {selectedEvent.type === "deadline" ? "Scadenza" : 
                         selectedEvent.type === "task" ? "Task" : "Meeting"}
                      </Badge>
                      {selectedEvent.priority && (
                        <Badge 
                          variant={selectedEvent.priority === "high" ? "destructive" : 
                                  selectedEvent.priority === "medium" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {selectedEvent.priority === "high" ? "Alta" : 
                           selectedEvent.priority === "medium" ? "Media" : "Bassa"} priorità
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedEvent.amount && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">
                        €{selectedEvent.amount}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
                    Chiudi
                  </Button>
                  {selectedEvent && selectedEvent.type === 'task' && (
                    <EditTaskDialog
                      task={tasks.find(task => task.id === selectedEvent.id) || selectedEvent}
                      trigger={
                        <Button>
                          Modifica
                        </Button>
                      }
                    />
                  )}
                  {selectedEvent && selectedEvent.type !== 'task' && (
                    <Button onClick={() => {
                      console.log('Modifica evento:', selectedEvent)
                      setIsEventDetailsOpen(false)
                      // TODO: Implementare dialog modifica scadenza
                      console.log('Dialog modifica scadenza da implementare')
                    }}>
                      Modifica
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  )
}
