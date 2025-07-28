import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invoiceSchema } from "@/lib/validations/invoice"

// GET: Recupera tutte le fatture
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Parametri di query opzionali
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const projectId = searchParams.get("projectId")
    const search = searchParams.get("search")

    // Costruzione del filtro
    const filter: any = {}
    
    if (status) {
      filter.status = status
    }
    
    if (clientId) {
      filter.clientId = clientId
    }
    
    if (projectId) {
      filter.projectId = projectId
    }
    
    if (search) {
      filter.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } }
      ]
    }

    // Recupera le fatture con filtri
    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            taxRate: true,
            timeEntryId: true,
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Serializza le date prima di restituirle
    const serializedInvoices = invoices.map(invoice => ({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }))

    return NextResponse.json(serializedInvoices)
  } catch (error) {
    console.error("Errore nel recupero delle fatture:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// POST: Crea una nuova fattura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const body = await request.json()
    
    // Validazione dei dati
    const validationResult = invoiceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { items, ...invoiceData } = validationResult.data

    // Crea la fattura con gli elementi
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        senderId: session.user.id,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            timeEntryId: item.timeEntryId || undefined,
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        items: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Serializza le date prima di restituirle
    const serializedInvoice = {
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }

    return NextResponse.json(serializedInvoice, { status: 201 })
  } catch (error) {
    console.error("Errore nella creazione della fattura:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
