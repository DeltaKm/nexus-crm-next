import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { timeEntrySchema } from "@/lib/validations/time-entry"

// GET: Recupera tutte le time entries dell'utente con filtri opzionali
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const taskId = searchParams.get("taskId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const billable = searchParams.get("billable")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Costruisci filtri dinamici
    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (taskId) {
      where.taskId = taskId
    }

    if (billable !== null) {
      where.billable = billable === "true"
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate)
      }
    }

    // Recupera time entries con relazioni
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                }
              }
            }
          },
          task: {
            select: {
              id: true,
              title: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          startTime: "desc"
        },
        skip: offset,
        take: limit,
      }),
      prisma.timeEntry.count({ where })
    ])

    // Calcola durata per ogni entry
    const timeEntriesWithDuration = timeEntries.map(entry => {
      let duration = 0
      if (entry.endTime) {
        duration = Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 1000 / 60) // minuti
      }
      
      return {
        ...entry,
        duration,
        isRunning: !entry.endTime
      }
    })

    return NextResponse.json({
      timeEntries: timeEntriesWithDuration,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Errore nel recupero time entries:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// POST: Crea una nuova time entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const body = await request.json()
    
    // Validazione con Zod
    const validatedData = timeEntrySchema.parse({
      ...body,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    })

    // Verifica che il progetto e il task esistano e appartengano all'utente
    const [project, task] = await Promise.all([
      prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          creatorId: session.user.id
        }
      }),
      prisma.task.findFirst({
        where: {
          id: validatedData.taskId,
          project: {
            creatorId: session.user.id
          }
        }
      })
    ])

    if (!project) {
      return new NextResponse("Progetto non trovato o accesso negato", { status: 404 })
    }

    if (!task) {
      return new NextResponse("Task non trovato o accesso negato", { status: 404 })
    }

    // Verifica che non ci sia già un timer attivo per questo utente
    if (!validatedData.endTime) {
      const activeTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          endTime: null
        }
      })

      if (activeTimer) {
        return new NextResponse("Hai già un timer attivo. Fermalo prima di iniziarne uno nuovo.", { status: 400 })
      }
    }

    // Crea la time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              }
            }
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Calcola durata
    let duration = 0
    if (timeEntry.endTime) {
      duration = Math.round((timeEntry.endTime.getTime() - timeEntry.startTime.getTime()) / 1000 / 60)
    }

    return NextResponse.json({
      ...timeEntry,
      duration,
      isRunning: !timeEntry.endTime
    }, { status: 201 })

  } catch (error) {
    console.error("Errore nella creazione time entry:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Dati non validi", { status: 400 })
    }
    
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
