import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Schema di validazione per l'aggiornamento utente
const updateUserSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").optional(),
  email: z.string().email("Email non valida").optional(),
  role: z.enum(["user", "admin", "superadmin"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri").optional(),
})

// Funzione per verificare se l'utente corrente è admin o superadmin
async function isAdminOrSuperadmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  return user && (user.role === "admin" || user.role === "superadmin")
}

// GET - Recupera un singolo utente
export async function GET(
  request: NextRequest,
  context: any // Usiamo any come workaround temporaneo per il bug di Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Verifica permessi
    const hasAdminAccess = await isAdminOrSuperadmin(session.user.id)
    if (!hasAdminAccess) {
      return new NextResponse("Accesso negato", { status: 403 })
    }

    const { id } = context.params as { id: string }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return new NextResponse("Utente non trovato", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Errore nel recupero dell'utente:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// PUT - Aggiorna un utente
export async function PUT(
  request: NextRequest,
  context: any // Usiamo any come workaround temporaneo per il bug di Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Verifica permessi
    const hasAdminAccess = await isAdminOrSuperadmin(session.user.id)
    if (!hasAdminAccess) {
      return new NextResponse("Accesso negato", { status: 403 })
    }

    const { id } = context.params as { id: string }
    
    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return new NextResponse("Utente non trovato", { status: 404 })
    }

    // Valida i dati
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Prepara i dati per l'aggiornamento
    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    
    // Se viene fornita una nuova password, hashala
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.format()), { status: 400 })
    }
    
    console.error("Errore nell'aggiornamento dell'utente:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

// DELETE - Elimina un utente
export async function DELETE(
  request: NextRequest,
  context: any // Usiamo any come workaround temporaneo per il bug di Next.js 15
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Verifica permessi
    const hasAdminAccess = await isAdminOrSuperadmin(session.user.id)
    if (!hasAdminAccess) {
      return new NextResponse("Accesso negato", { status: 403 })
    }

    const { id } = context.params as { id: string }
    
    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return new NextResponse("Utente non trovato", { status: 404 })
    }

    // Impedisci l'eliminazione di se stessi
    if (id === session.user.id) {
      return new NextResponse("Non puoi eliminare il tuo account", { status: 400 })
    }

    // Elimina l'utente
    await prisma.user.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Errore nell'eliminazione dell'utente:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
