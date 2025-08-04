import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateTimeEntrySchema, stopTimerSchema } from "@/lib/validations/time-entry"

// GET: Recupera una time entry specifica
export async function GET(
  request: NextRequest,
  context: any // Workaround per Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const { id } = context.params as { id: string }
    
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
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

    if (!timeEntry) {
      return new NextResponse("Time entry non trovata", { status: 404 })
    }

    // Calcola durata
    let duration = 0
    if (timeEntry.endTime) {
      duration = Math.round((timeEntry.endTime.getTime() - timeEntry.startTime.getTime()) / 1000 / 60)
    }

    return NextResponse.json({
      ...timeEntry,
      duration,
      isRunning: !timeEntry.endTime
    })

  } catch (error) {
    console.error("Errore nel recupero time entry:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// PUT: Aggiorna una time entry esistente
export async function PUT(
  request: NextRequest,
  context: any // Workaround per Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const { id } = context.params as { id: string }
    const body = await request.json()

    // Verifica che la time entry esista e appartenga all'utente
    const existingTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      }
    })

    if (!existingTimeEntry) {
      return new NextResponse("Time entry non trovata", { status: 404 })
    }

    // Gestione speciale per fermare il timer
    if (body.action === "stop" && body.endTime) {
      const stopData = stopTimerSchema.parse({
        endTime: new Date(body.endTime)
      })

      const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          endTime: stopData.endTime,
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

      const duration = Math.round((updatedTimeEntry.endTime!.getTime() - updatedTimeEntry.startTime.getTime()) / 1000 / 60)

      return NextResponse.json({
        ...updatedTimeEntry,
        duration,
        isRunning: false
      })
    }

    // Validazione normale per aggiornamenti completi
    const validatedData = updateTimeEntrySchema.parse({
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    })

    // Se viene specificato un nuovo progetto o task, verifica i permessi
    if (validatedData.projectId || validatedData.taskId) {
      const projectId = validatedData.projectId || existingTimeEntry.projectId
      const taskId = validatedData.taskId || existingTimeEntry.taskId

      const [project, task] = await Promise.all([
        prisma.project.findFirst({
          where: {
            id: projectId,
            creatorId: session.user.id
          }
        }),
        prisma.task.findFirst({
          where: {
            id: taskId,
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
    }

    // Aggiorna la time entry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data: validatedData,
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
    if (updatedTimeEntry.endTime) {
      duration = Math.round((updatedTimeEntry.endTime.getTime() - updatedTimeEntry.startTime.getTime()) / 1000 / 60)
    }

    return NextResponse.json({
      ...updatedTimeEntry,
      duration,
      isRunning: !updatedTimeEntry.endTime
    })

  } catch (error) {
    console.error("Errore nell'aggiornamento time entry:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Dati non validi", { status: 400 })
    }
    
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// DELETE: Elimina una time entry
export async function DELETE(
  request: NextRequest,
  context: any // Workaround per Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const { id } = context.params as { id: string }

    // Verifica che la time entry esista e appartenga all'utente
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      }
    })

    if (!timeEntry) {
      return new NextResponse("Time entry non trovata", { status: 404 })
    }

    // Elimina la time entry
    await prisma.timeEntry.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error("Errore nell'eliminazione time entry:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
