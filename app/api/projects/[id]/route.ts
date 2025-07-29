import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { projectFormSchema } from "@/lib/validations/project"

type RouteParams = {
  params: {
    id: string
  }
}

// GET /api/projects/:id
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      )
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: "Progetto non trovato" },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero del progetto" },
      { status: 500 }
    )
  }
}

// PUT /api/projects/:id
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      )
    }

    const { id } = await params
    const json = await req.json()
    
    const validatedData = projectFormSchema.parse(json)
    
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { message: "Progetto non trovato" },
        { status: 404 }
      )
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        clientId: validatedData.clientId,
        startDate: validatedData.startDate || null,
        endDate: validatedData.endDate || null,
        status: validatedData.status,
        budget: validatedData.budget,
        notes: validatedData.notes,
        completed: validatedData.completed,
        repository: validatedData.repository,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error: any) {
    console.error("Error updating project:", error)
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { message: "Dati non validi", errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'aggiornamento del progetto" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/:id
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { message: "Progetto non trovato" },
        { status: 404 }
      )
    }

    // Verificare se ci sono task o timeEntries associati
    const relatedItems = await prisma.$transaction([
      prisma.task.count({ where: { projectId: id } }),
      prisma.timeEntry.count({ where: { projectId: id } }),
    ])
    
    const hasTasks = relatedItems[0] > 0
    const hasTimeEntries = relatedItems[1] > 0
    
    if (hasTasks || hasTimeEntries) {
      return NextResponse.json(
        { 
          message: "Impossibile eliminare il progetto perché ha task o registrazioni di tempo associate",
          hasTasks,
          hasTimeEntries
        },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'eliminazione del progetto" },
      { status: 500 }
    )
  }
}
