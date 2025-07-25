import { PrismaClient } from '@prisma/client'

// Augment the NodeJS.Global type to include __prisma
// This is the standard way to extend the global object in Node.js
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  // In production, create a new client
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient()
  }
  // In development, reuse the same client
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  return global.__prisma
}

export const prisma = getPrismaClient()