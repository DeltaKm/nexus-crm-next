import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { invoiceSchema } from "@/lib/validations/invoice"

// GET: Recupera una fattura specifica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const id = params.id
    
    // Recupera la fattura
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
      }
    })

    if (!invoice) {
      return new NextResponse("Fattura non trovata", { status: 404 })
    }

    // Serializza le date prima di restituirle
    const serializedInvoice = {
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error("Errore nel recupero della fattura:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// PUT: Aggiorna una fattura esistente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const id = params.id
    const body = await request.json()
    
    // Validazione dei dati
    const validationResult = invoiceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Verifica che la fattura esista
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingInvoice) {
      return new NextResponse("Fattura non trovata", { status: 404 })
    }

    const { items, ...invoiceData } = validationResult.data

    // Aggiorna la fattura
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Elimina gli elementi esistenti
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      // Aggiorna la fattura e crea nuovi elementi
      return tx.invoice.update({
        where: { id },
        data: {
          ...invoiceData,
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
    })

    // Serializza le date prima di restituirle
    const serializedInvoice = {
      ...updatedInvoice,
      issueDate: updatedInvoice.issueDate.toISOString(),
      dueDate: updatedInvoice.dueDate.toISOString(),
      createdAt: updatedInvoice.createdAt.toISOString(),
      updatedAt: updatedInvoice.updatedAt.toISOString(),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error("Errore nell'aggiornamento della fattura:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// DELETE: Elimina una fattura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    const id = params.id

    // Verifica che la fattura esista
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return new NextResponse("Fattura non trovata", { status: 404 })
    }

    // Elimina la fattura e gli elementi associati in una transazione
    await prisma.$transaction(async (tx) => {
      // Elimina gli elementi della fattura
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      // Elimina la fattura
      await tx.invoice.delete({
        where: { id }
      })
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Errore nell'eliminazione della fattura:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
