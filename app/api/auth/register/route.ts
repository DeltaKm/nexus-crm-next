import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/app/generated/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const prisma = new PrismaClient()

const registerSchema = z.object({
  fullName: z.string().min(2, "Il nome completo è richiesto"),
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password } = registerSchema.parse(body)

    // Controlla se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utente con questa email esiste già" },
        { status: 400 }
      )
    }

    // Controlla se è il primo utente (diventa admin automaticamente)
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crea il nuovo utente
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: isFirstUser ? "admin" : "user", // Primo utente = admin
        emailVerified: new Date(), // Auto-verifica per semplicità
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      message: isFirstUser 
        ? "Primo utente creato con successo! Hai i privilegi di amministratore." 
        : "Utente creato con successo!",
      user,
      isFirstUser
    })

  } catch (error) {
    console.error("Errore durante la registrazione:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dati non validi", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
