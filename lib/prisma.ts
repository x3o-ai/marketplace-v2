import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
async function gracefulShutdown() {
  await prisma.$disconnect()
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

export { prisma as default }