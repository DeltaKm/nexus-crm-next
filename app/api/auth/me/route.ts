import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorizzato", { status: 401 })
    }

    // Recupera i dettagli dell'utente corrente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    console.error("Errore nel recupero del profilo utente:", error)
    return new NextResponse("Errore interno del server", { status: 500 })
  }
}
