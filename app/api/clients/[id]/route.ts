import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@/app/generated/prisma"
import { clientUpdateSchema } from "@/lib/schemas/client"

type RouteParams = {
  params: {
    id: string
  }
}

const prisma = new PrismaClient()

// GET /api/clients/[id] - Fetch single client
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        projects: {
          include: {
            creator: { select: { id: true, name: true } },
            _count: { select: { tasks: true } }
          }
        },
        invoices: {
          include: {
            sender: { select: { id: true, name: true } },
            items: true
          }
        },
        _count: {
          select: {
            projects: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const validatedData = clientUpdateSchema.parse(body)

    // Gestisci il campo lastContact - converti stringa vuota in null
    const processedData = {
      ...validatedData,
      lastContact: validatedData.lastContact === "" ? null : validatedData.lastContact
    }

    const client = await prisma.client.update({
      where: { id },
      data: processedData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            projects: true,
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error updating client:", error)
    
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

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params
    
    // Check if client has associated projects or invoices
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 })
    }

    if (client._count.projects > 0 || client._count.invoices > 0) {
      return NextResponse.json(
        { error: "Impossibile eliminare il cliente: ha progetti o fatture associati" },
        { status: 400 }
      )
    }

    const deletedClient = await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Cliente eliminato con successo" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
