"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, SearchIcon } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  assigneeId: string | null
  project?: {
    name: string
    client?: {
      name: string
    }
  }
  assignee?: {
    id: string
    name: string | null
    email: string
  } | null
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks")
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei task")
      }
      return response.json()
    },
  })

  // Filtra i task in base ai criteri di ricerca
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = searchQuery
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.project?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.project?.client?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true

    const matchesStatus = statusFilter ? task.status === statusFilter : true
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "Bassa"
      case "MEDIUM":
        return "Media"
      case "HIGH":
        return "Alta"
      case "URGENT":
        return "Urgente"
      default:
        return priority
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "Da Fare"
      case "IN_PROGRESS":
        return "In Corso"
      case "REVIEW":
        return "Revisione"
      case "DONE":
        return "Completato"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-blue-100 text-blue-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "URGENT":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "REVIEW":
        return "bg-purple-100 text-purple-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Task</h1>
        <AddTaskDialog
          trigger={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nuovo Task
            </Button>
          }
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtra per stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="TODO">Da Fare</SelectItem>
              <SelectItem value="IN_PROGRESS">In Corso</SelectItem>
              <SelectItem value="REVIEW">Revisione</SelectItem>
              <SelectItem value="DONE">Completato</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter || "all"}
            onValueChange={(value) => setPriorityFilter(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtra per priorità" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le priorità</SelectItem>
              <SelectItem value="LOW">Bassa</SelectItem>
              <SelectItem value="MEDIUM">Media</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Titolo</th>
                  <th className="text-left py-3 px-4 font-medium">Progetto</th>
                  <th className="text-left py-3 px-4 font-medium">Stato</th>
                  <th className="text-left py-3 px-4 font-medium">Priorità</th>
                  <th className="text-left py-3 px-4 font-medium">Scadenza</th>
                  <th className="text-left py-3 px-4 font-medium">Assegnato a</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <TaskDetailsDialog
                    key={task.id}
                    taskId={task.id}
                    trigger={
                      <tr
                        className="border-b hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="py-3 px-4">{task.title}</td>
                        <td className="py-3 px-4">
                          {task.project?.name || "N/A"}
                          {task.project?.client && (
                            <span className="text-xs text-muted-foreground block">
                              {task.project.client.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "dd/MM/yyyy", {
                                locale: it,
                              })
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {task.assignee
                            ? task.assignee.name || task.assignee.email
                            : "Non assegnato"}
                        </td>
                      </tr>
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter || priorityFilter
                ? "Nessun task corrisponde ai filtri selezionati."
                : "Nessun task disponibile. Crea il tuo primo task!"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
