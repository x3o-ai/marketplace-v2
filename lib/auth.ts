import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: true,
            aiInteractions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        })

        if (!user) {
          return null
        }

        // TODO: Implement password verification when we add password field to schema
        // For now, allow login for trial users
        const isValidPassword = true // await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValidPassword) {
          return null
        }

        // Calculate trial status
        const trialEndDate = new Date(user.createdAt)
        trialEndDate.setDate(trialEndDate.getDate() + 14)
        const trialActive = new Date() < trialEndDate
        const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          organizationId: user.organizationId,
          organization: user.organization?.name,
          trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
          trialDaysLeft: daysLeft,
          permissions: user.permissions,
          aiInteractions: user.aiInteractions.length,
          lastLoginAt: user.lastLoginAt?.toISOString()
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
        token.trialStatus = user.trialStatus
        token.trialDaysLeft = user.trialDaysLeft
        token.permissions = user.permissions
        token.aiInteractions = user.aiInteractions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization as string
        session.user.trialStatus = token.trialStatus as string
        session.user.trialDaysLeft = token.trialDaysLeft as number
        session.user.permissions = token.permissions as string[]
        session.user.aiInteractions = token.aiInteractions as number
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect logic based on user status
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        // Log new user signup
        await prisma.aIInteraction.create({
          data: {
            userId: user.id!,
            agentId: 'system',
            query: 'User signed up via NextAuth',
            response: 'Welcome to x3o.ai Trinity Agents!',
            confidence: 1.0,
            processingTime: 0,
            category: 'user_onboarding',
            tags: ['signup', 'auth', 'new_user'],
            status: 'COMPLETED'
          }
        })
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id! },
        data: { lastLoginAt: new Date() }
      })
    }
  },
  debug: process.env.NODE_ENV === 'development',
}