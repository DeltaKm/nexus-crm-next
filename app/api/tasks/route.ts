import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskFormSchema } from "@/lib/validations/task"

// GET /api/tasks - Recupera tutti i task o filtra per progetto
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const assigneeId = searchParams.get("assigneeId")

    // Costruisci la query in base ai filtri
    const whereClause: any = {}
    
    if (projectId) {
      whereClause.projectId = projectId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (assigneeId) {
      whereClause.assigneeId = assigneeId === "null" ? null : assigneeId
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("[TASKS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// POST /api/tasks - Crea un nuovo task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await request.json()
    const body = taskFormSchema.parse(json)

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId: body.projectId,
        assigneeId: body.assigneeId || null,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.format()), { status: 400 })
    }

    console.error("[TASKS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
