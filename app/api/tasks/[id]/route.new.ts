import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskFormSchema } from "@/lib/validations/task"

interface RouteContext {
  params: {
    id: string
  }
}

// GET /api/tasks/[id] - Recupera un task specifico
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { params } = context
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            name: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!task) {
      return new NextResponse("Task non trovato", { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// PUT /api/tasks/[id] - Aggiorna un task esistente
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { params } = context
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    const json = await request.json()
    const body = taskFormSchema.parse(json)

    // Controlla se il task esiste
    const existingTask = await prisma.task.findUnique({
      where: {
        id,
      },
    })

    if (!existingTask) {
      return new NextResponse("Task non trovato", { status: 404 })
    }

    // Aggiorna il task
    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId: body.projectId,
        assigneeId: body.assigneeId || null,
        completedAt: body.status === "DONE" ? new Date() : null,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.format()), { status: 400 })
    }

    console.error("[TASK_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Elimina un task
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { params } = context
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    // Controlla se il task esiste
    const existingTask = await prisma.task.findUnique({
      where: {
        id,
      },
    })

    if (!existingTask) {
      return new NextResponse("Task non trovato", { status: 404 })
    }

    // Elimina il task
    await prisma.task.delete({
      where: {
        id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
