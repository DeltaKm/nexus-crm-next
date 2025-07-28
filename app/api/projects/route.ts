import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@/app/generated/prisma"
import { projectFormSchema } from "@/lib/schemas/project"

const prisma = new PrismaClient()

// GET /api/projects - Fetch all projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    if (clientId) {
      whereClause.clientId = clientId
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, company: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Creating project with data:", body)
    
    const validatedData = projectFormSchema.parse(body)
    console.log("Validated project data:", validatedData)

    // Converti le stringhe di data in oggetti Date
    const projectData = {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      creatorId: session.user.id,
    }

    const project = await prisma.project.create({
      data: projectData,
      include: {
        client: {
          select: { id: true, name: true, company: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true
          }
        }
      }
    })

    console.log("Project created successfully:", project)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dati non validi", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
