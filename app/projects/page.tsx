"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Building2,
  Clock,
  DollarSign,
  BarChart
} from "lucide-react"
import { toast } from "sonner"
import AddProjectDialog from "@/components/projects/AddProjectDialog"
import ProjectDetailsDialog from "@/components/projects/ProjectDetailsDialog"
import EditProjectDialog from "@/components/projects/EditProjectDialog"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  budget?: number | null
  notes?: string | null
  completed: number
  repository?: string | null
  createdAt: string
  clientId: string
  client: {
    id: string
    name: string
    company?: string | null
  }
  creator: {
    id: string
    name: string
    email: string
  }
  _count?: {
    tasks: number
    timeEntries: number
  }
}

const fetchProjects = async (search?: string, status?: string): Promise<Project[]> => {
  let url = "/api/projects?"
  if (search) url += `&search=${encodeURIComponent(search)}`
  if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Errore nel caricamento dei progetti")
  }
  return response.json()
}

export default function ProjectsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", searchTerm, statusFilter],
    queryFn: () => fetchProjects(searchTerm, statusFilter),
    enabled: sessionStatus === "authenticated"
  })

  if (sessionStatus === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
  }

  const handleProjectUpdate = () => {
    refetch()
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "planning":
        return "secondary"
      case "in-progress":
        return "default"
      case "review":
        return "secondary"
      case "completed":
        return "outline"
      case "on-hold":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Pianificazione"
      case "in-progress":
        return "In Corso"
      case "review":
        return "Revisione"
      case "completed":
        return "Completato"
      case "on-hold":
        return "In Pausa"
      default:
        return status
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Progetti</h1>
            <p className="text-gray-500 mt-1">
              Gestisci i tuoi progetti e le relative attività
            </p>
        </div>
        <Button onClick={() => setIsAddProjectDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Progetto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Cerca progetti..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Stato</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="planning">Pianificazione</SelectItem>
              <SelectItem value="in-progress">In Corso</SelectItem>
              <SelectItem value="review">Revisione</SelectItem>
              <SelectItem value="completed">Completato</SelectItem>
              <SelectItem value="on-hold">In Pausa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento progetti...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>Si è verificato un errore nel caricamento dei progetti.</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => refetch()}
            >
              Riprova
            </Button>
          </div>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProjectClick(project)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-lg">{project.name}</h3>
                  </div>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || "Nessuna descrizione"}
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="truncate">{project.client.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/D"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      {project.budget ? `€${project.budget.toLocaleString()}` : "N/D"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{project._count?.tasks || 0} task</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${project.completed}%` }}
                  ></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">
                  {project.completed}% completato
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nessun progetto trovato</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Prova a modificare i filtri di ricerca" 
              : "Inizia creando il tuo primo progetto"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button 
              onClick={() => setIsAddProjectDialogOpen(true)}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Progetto
            </Button>
          )}
        </div>
      )}
      
      {isAddProjectDialogOpen && (
        <AddProjectDialog 
          open={isAddProjectDialogOpen} 
          onOpenChange={setIsAddProjectDialogOpen}
          onProjectAdded={handleProjectUpdate}
        />
      )}
      
      {selectedProject && isDetailsOpen && (
        <ProjectDetailsDialog
          project={selectedProject}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onProjectUpdate={handleProjectUpdate}
          onEditProject={(project) => {
            setSelectedProject(project);
            setIsDetailsOpen(false);
            setIsEditDialogOpen(true);
          }}
        />
      )}
      
      {selectedProject && isEditDialogOpen && (
        <EditProjectDialog
          project={selectedProject}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onProjectUpdate={handleProjectUpdate}
        />
      )}
      </div>
    </DashboardLayout>
  )
}
