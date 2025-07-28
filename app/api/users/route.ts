import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Schema di validazione per la creazione utente
const createUserSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.enum(["user", "admin", "superadmin"]).default("user"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Verifica se l'utente è admin o superadmin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Controllo case-insensitive del ruolo per admin/superadmin
    const userRole = currentUser?.role?.toLowerCase()
    console.log("Ruolo utente API:", currentUser?.role, "Lowercase:", userRole)
    
    if (!currentUser || (userRole !== "admin" && userRole !== "superadmin")) {
      console.log("Accesso negato: ruolo utente", currentUser?.role)
      return new NextResponse("Accesso negato", { status: 403 })
    }

    // Recupera tutti gli utenti con informazioni complete
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Verifica se l'utente è admin o superadmin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Controllo case-insensitive del ruolo per admin/superadmin
    const userRole = currentUser?.role?.toLowerCase()
    
    if (!currentUser || (userRole !== "admin" && userRole !== "superadmin")) {
      return new NextResponse("Accesso negato", { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verifica se l'email esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return new NextResponse("Un utente con questa email esiste già", { status: 400 })
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Crea il nuovo utente
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.format()), { status: 400 })
    }
    
    console.error("Errore nella creazione dell'utente:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
