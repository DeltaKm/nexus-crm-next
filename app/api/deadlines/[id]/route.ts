import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const deadlineUpdateSchema = z.object({
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  paymentType: z.string().optional(),
  description: z.string().optional(),
  dueNotes: z.string().optional().nullable(),
  amount: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
  paymentDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  paymentNotes: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const resolvedParams = await params
    const deadline = await prisma.deadlinePayment.findUnique({
      where: { id: resolvedParams.id },
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

    if (!deadline) {
      return NextResponse.json(
        { error: "Scadenza non trovata" },
        { status: 404 }
      )
    }

    return NextResponse.json(deadline)
  } catch (error) {
    console.error("Error fetching deadline:", error)
    return NextResponse.json(
      { error: "Errore durante il recupero della scadenza" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = deadlineUpdateSchema.parse(body)

    const resolvedParams = await params
    const deadline = await prisma.deadlinePayment.update({
      where: { id: resolvedParams.id },
      data: {
        ...validatedData,
        clientId: validatedData.clientId,
        projectId: validatedData.projectId,
        documentId: validatedData.documentId,
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

    return NextResponse.json(deadline)
  } catch (error) {
    console.error("Error updating deadline:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dati non validi", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della scadenza" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const resolvedParams = await params
    await prisma.deadlinePayment.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: "Scadenza eliminata con successo" })
  } catch (error) {
    console.error("Error deleting deadline:", error)
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della scadenza" },
      { status: 500 }
    )
  }
}
