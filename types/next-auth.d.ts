import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      organizationId?: string
      permissions: string[]
      trialStatus?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    organizationId?: string
    permissions: string[]
    trialStatus?: string
    organization?: {
      id: string
      name: string
      domain?: string
      subscription: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organizationId?: string
    permissions: string[]
    trialStatus?: string
  }
}