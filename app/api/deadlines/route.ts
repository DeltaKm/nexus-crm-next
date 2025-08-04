import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const deadlineSchema = z.object({
  dueDate: z.string().transform((str) => new Date(str)),
  paymentType: z.string().optional(),
  description: z.string().optional(),
  dueNotes: z.string().optional(),
  amount: z.number().min(0),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  documentId: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const deadlines = await prisma.deadlinePayment.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json(deadlines)
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json(
      { error: "Errore durante il recupero delle scadenze" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = deadlineSchema.parse(body)

    const deadline = await prisma.deadlinePayment.create({
      data: {
        ...validatedData,
        clientId: validatedData.clientId || null,
        projectId: validatedData.projectId || null,
        documentId: validatedData.documentId || null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(deadline, { status: 201 })
  } catch (error) {
    console.error("Error creating deadline:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dati non validi", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Errore durante la creazione della scadenza" },
      { status: 500 }
    )
  }
}
