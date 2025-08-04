"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { it } from "date-fns/locale"
import { Calendar, Clock, TrendingUp, DollarSign, Search, ChevronLeft, ChevronRight } from "lucide-react"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TimeTracker } from "@/components/time-entries/TimeTracker"
import { TimeEntriesList } from "@/components/time-entries/TimeEntriesList"
import { AddTimeEntryDialog } from "@/components/time-entries/AddTimeEntryDialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { TimeEntriesResponse, TimeStats, TimePeriod } from "@/types/time-entry"
import type { Project } from "@/types/project"

export default function TimeEntriesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("today" as TimePeriod)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date()) // For month/year navigation

  // Calcola le date per il periodo selezionato
  const getDateRange = (period: TimePeriod) => {
    const now = new Date()
    const baseDate = period === "month" ? selectedDate : now
    
    switch (period) {
      case "today":
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
        }
      case "week":
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
          endDate: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        }
      case "month":
        return {
          startDate: startOfMonth(baseDate).toISOString(),
          endDate: endOfMonth(baseDate).toISOString(),
        }
      default:
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
        }
    }
  }

  const dateRange = getDateRange(selectedPeriod)

  // Query per le time entries
  const {
    data: timeEntriesData,
    isLoading: isLoadingTimeEntries,
    refetch: refetchTimeEntries,
  } = useQuery<TimeEntriesResponse>({
    queryKey: ["time-entries", selectedPeriod, dateRange, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: "100",
      })
      const response = await fetch(`/api/time-entries?${params}`)
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle time entries")
      }
      return response.json()
    },
  })

  // Query per i progetti
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei progetti")
      }
      return response.json()
    },
  })

  // Filtra i progetti in base al termine di ricerca
  const filteredProjects = projects.filter(project => {
    const nameMatch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const clientMatch = project.client?.name && project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    return nameMatch || clientMatch
  })

  // Filtra le time entries in base al termine di ricerca
  const filteredTimeEntries = (timeEntriesData?.timeEntries || []).filter(entry => {
    if (!searchTerm) return true
    
    const descriptionMatch = entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const projectMatch = entry.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const taskMatch = entry.task?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const clientMatch = entry.project?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return descriptionMatch || projectMatch || taskMatch || clientMatch
  })

  // Funzioni per navigazione mesi
  const goToPreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1))
  }

  const goToCurrentMonth = () => {
    setSelectedDate(new Date())
  }

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

  // Calcola le statistiche
  const calculateStats = (): TimeStats => {
    if (!timeEntriesData?.timeEntries) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        billableMinutes: 0,
        billableHours: 0,
        nonBillableMinutes: 0,
        nonBillableHours: 0,
        entriesCount: 0,
      }
    }

    const entries = timeEntriesData.timeEntries.filter(entry => !entry.isRunning)
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0)
    const billableMinutes = entries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.duration, 0)

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableMinutes,
      billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      nonBillableMinutes: totalMinutes - billableMinutes,
      nonBillableHours: Math.round(((totalMinutes - billableMinutes) / 60) * 100) / 100,
      entriesCount: entries.length,
    }
  }

  const stats = calculateStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const calculateTotalValue = () => {
    if (!timeEntriesData?.timeEntries) return 0
    return timeEntriesData.timeEntries
      .filter(entry => entry.billable && entry.rate && !entry.isRunning)
      .reduce((sum, entry) => sum + (entry.duration / 60) * entry.rate!, 0)
  }

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case "today":
        return "Oggi"
      case "week":
        return "Questa settimana"
      case "month":
        return "Questo mese"
      default:
        return "Oggi"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
            <p className="text-muted-foreground">
              Traccia il tempo lavorato sui tuoi progetti
            </p>
          </div>
          <AddTimeEntryDialog
            projects={filteredProjects}
            tasks={tasks}
            onTimeEntryAdded={() => refetchTimeEntries()}
          />
        </div>

        {/* Barra di ricerca e navigazione mesi */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              {/* Barra di ricerca */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca time entries, progetti, task..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Navigazione mesi - solo per il periodo "mese" */}
              {selectedPeriod === "month" && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Mese precedente
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToCurrentMonth}
                      className="text-sm"
                    >
                      Oggi
                    </Button>
                    <span className="text-sm font-medium">
                      {format(selectedDate, "MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="flex items-center gap-2"
                  >
                    Mese successivo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        <TimeTracker
          projects={filteredProjects}
          tasks={tasks}
          onTimerUpdate={() => refetchTimeEntries()}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ore Totali</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.entriesCount} time entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ore Fatturabili</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.billableHours}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.nonBillableHours}h non fatturabili
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(calculateTotalValue())}</div>
              <p className="text-xs text-muted-foreground">
                Solo ore fatturabili
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Periodo</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPeriodLabel(selectedPeriod)}</div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(dateRange.startDate), "dd/MM", { locale: it })} -{" "}
                {format(new Date(dateRange.endDate), "dd/MM", { locale: it })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs per periodi */}
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as TimePeriod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Oggi</TabsTrigger>
            <TabsTrigger value="week">Settimana</TabsTrigger>
            <TabsTrigger value="month">Mese</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {isLoadingTimeEntries ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : (
              <TimeEntriesList
                timeEntries={filteredTimeEntries}
                projects={filteredProjects}
                tasks={tasks}
                onTimeEntryUpdated={() => refetchTimeEntries()}
                showGrouping={false}
              />
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {isLoadingTimeEntries ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : (
              <TimeEntriesList
                timeEntries={filteredTimeEntries}
                projects={filteredProjects}
                tasks={tasks}
                onTimeEntryUpdated={() => refetchTimeEntries()}
                showGrouping={true}
              />
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {isLoadingTimeEntries ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : (
              <TimeEntriesList
                timeEntries={filteredTimeEntries}
                projects={filteredProjects}
                tasks={tasks}
                onTimeEntryUpdated={() => refetchTimeEntries()}
                showGrouping={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
