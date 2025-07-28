import { NextResponse } from "next/server"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    return NextResponse.json({ isFirstUser })
  } catch (error) {
    console.error("Error checking first user:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
