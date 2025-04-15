import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    const data = await request.json()
    const { categories = [], tags = [] } = data

    const image = await prisma.image.update({
      where: { id },
      data: {
        categories: {
          set: [], // First clear existing relationships
          connect: categories.map((name: string) => ({ name }))
        },
        tags: {
          set: [], // First clear existing relationships
          connect: tags.map((name: string) => ({ name }))
        }
      },
      include: {
        categories: true,
        tags: true
      }
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { error: 'Error updating image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    await prisma.image.delete({
      where: { id }
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Error deleting image' },
      { status: 500 }
    )
  }
} 