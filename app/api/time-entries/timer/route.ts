import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startTimerSchema, stopTimerSchema } from "@/lib/validations/time-entry"

// GET: Recupera il timer attivo dell'utente (se esiste)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null, // Timer ancora attivo
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
      },
      orderBy: {
        startTime: "desc"
      }
    })

    if (!activeTimer) {
      return NextResponse.json({ activeTimer: null })
    }

    // Calcola durata corrente
    const duration = Math.round((Date.now() - activeTimer.startTime.getTime()) / 1000 / 60)

    return NextResponse.json({
      activeTimer: {
        ...activeTimer,
        duration,
        isRunning: true
      }
    })

  } catch (error) {
    console.error("Errore nel recupero timer attivo:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// POST: Avvia un nuovo timer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const body = await request.json()
    
    // Validazione con Zod
    const validatedData = startTimerSchema.parse({
      ...body,
      startTime: new Date(body.startTime || new Date()),
    })

    // Verifica che non ci sia già un timer attivo
    const existingTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    if (existingTimer) {
      return new NextResponse("Hai già un timer attivo. Fermalo prima di iniziarne uno nuovo.", { status: 400 })
    }

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

    // Crea il nuovo timer
    const timer = await prisma.timeEntry.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        endTime: null, // Timer attivo
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

    return NextResponse.json({
      ...timer,
      duration: 0,
      isRunning: true
    }, { status: 201 })

  } catch (error) {
    console.error("Errore nell'avvio timer:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Dati non validi", { status: 400 })
    }
    
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// PUT: Ferma il timer attivo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const body = await request.json()
    
    // Validazione con Zod
    const validatedData = stopTimerSchema.parse({
      endTime: new Date(body.endTime || new Date()),
    })

    // Trova il timer attivo
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    if (!activeTimer) {
      return new NextResponse("Nessun timer attivo trovato", { status: 404 })
    }

    // Verifica che l'endTime sia dopo startTime
    if (validatedData.endTime <= activeTimer.startTime) {
      return new NextResponse("L'orario di fine deve essere successivo all'orario di inizio", { status: 400 })
    }

    // Ferma il timer
    const stoppedTimer = await prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime: validatedData.endTime,
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

    // Calcola durata finale
    const duration = Math.round((stoppedTimer.endTime!.getTime() - stoppedTimer.startTime.getTime()) / 1000 / 60)

    return NextResponse.json({
      ...stoppedTimer,
      duration,
      isRunning: false
    })

  } catch (error) {
    console.error("Errore nel fermare timer:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Dati non validi", { status: 400 })
    }
    
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
