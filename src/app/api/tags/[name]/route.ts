import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  context: { params: { name: string } }
) {
  try {
    const name = context.params.name
    await prisma.tag.delete({
      where: { name }
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Error deleting tag' },
      { status: 500 }
    )
  }
} 