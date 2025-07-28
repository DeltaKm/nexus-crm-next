import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { PrismaClient } from "@/app/generated/prisma"
import { clientFormSchema } from "@/lib/schemas/client"
// Note: authOptions will be imported from a shared config file

const prisma = new PrismaClient()

// GET /api/clients - Fetch all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }
    
    if (status && status !== "all") {
      where.status = status
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        projects: {
          select: { id: true, name: true, status: true }
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true }
        },
        _count: {
          select: {
            projects: true,
            invoices: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Debug: log della sessione
    console.log('Session debug:', {
      user: session.user,
      userId: session.user?.id,
      userIdType: typeof session.user?.id
    })

    if (!session.user?.id) {
      return NextResponse.json({ error: "ID utente mancante nella sessione" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = clientFormSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        name: validatedData.name,
        company: validatedData.company || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        category: validatedData.category,
        status: validatedData.status,
        notes: validatedData.notes || null,
        lastContact: validatedData.lastContact ? new Date(validatedData.lastContact) : null,
        creatorId: session.user.id,
      },
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

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    
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
