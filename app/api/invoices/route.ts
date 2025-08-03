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

    // Serializza le date e calcola l'importo totale
    const serializedInvoices = invoices.map(invoice => {
      // Calcola l'importo totale dalla somma degli items
      const amount = invoice.items.reduce((total, item) => {
        const itemSubtotal = item.quantity * item.unitPrice
        const itemTax = (itemSubtotal * item.taxRate) / 100
        return total + itemSubtotal + itemTax
      }, 0)
      
      return {
        ...invoice,
        amount: parseFloat(amount.toFixed(2)), // Arrotonda a 2 decimali
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(serializedInvoices)
  } catch (error) {
    console.error("Errore nel recupero delle fatture:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// POST: Crea una nuova fattura
export async function POST(request: NextRequest) {
  try {
    console.log('=== INVOICE CREATION START ===')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.id)
    const body = await request.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2))
    
    // Validazione dei dati
    console.log('🔍 Starting validation...')
    const validationResult = invoiceSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed')
    const { items, ...invoiceData } = validationResult.data
    console.log('📋 Invoice data:', invoiceData)
    console.log('📦 Items:', items)

    // Controlla se esiste già una fattura con lo stesso numero
    console.log('🔍 Checking for duplicate invoice number...')
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: invoiceData.invoiceNumber
      }
    })
    
    if (existingInvoice) {
      console.log('❌ Duplicate invoice number found:', invoiceData.invoiceNumber)
      return NextResponse.json(
        { 
          error: 'Numero fattura già esistente',
          message: `Una fattura con il numero ${invoiceData.invoiceNumber} esiste già. Scegli un numero diverso.`
        },
        { status: 409 }
      )
    }
    
    console.log('✅ Invoice number is unique')

    // Crea la fattura con gli elementi
    console.log('💾 Creating invoice in database...')
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

    console.log('✅ Invoice created successfully:', invoice.id)
    console.log('=== INVOICE CREATION END ===')
    return NextResponse.json(serializedInvoice, { status: 201 })
  } catch (error) {
    console.error("❌ Errore nella creazione della fattura:", error)
    console.log('=== INVOICE CREATION FAILED ===')
    return NextResponse.json(
      { error: 'Errore interno del server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
