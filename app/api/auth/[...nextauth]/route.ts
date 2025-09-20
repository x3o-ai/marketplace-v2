import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth for easy sign-in
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    
    // Credentials provider for Trinity Agent trial users
    CredentialsProvider({
      id: 'trinity-credentials',
      name: 'Trinity Agent Trial',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your-email@company.com'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in Trinity Agent database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            },
            include: {
              organization: true,
              subscriptions: {
                where: {
                  status: {
                    in: ['ACTIVE', 'TRIAL', 'TRIALING']
                  }
                },
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1
              }
            }
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          // For trial users, we don't require password validation
          // since they register through the Trinity Agent signup flow
          if (user.permissions.includes('trinity_agent_trial')) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
              organizationId: user.organizationId,
              organization: user.organization,
              permissions: user.permissions,
              trialStatus: user.subscriptions.length > 0 ? user.subscriptions[0].status : null
            }
          }

          // For regular users with passwords (future enhancement)
          if (credentials.password && user.password) {
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
            if (isPasswordValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
                organizationId: user.organizationId,
                organization: user.organization,
                permissions: user.permissions
              }
            }
          }

          return null
        } catch (error) {
          console.error('NextAuth authorization error:', error)
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days for Trinity Agent trials
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist Trinity Agent user data to token
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.permissions = user.permissions
        token.trialStatus = user.trialStatus
      }
      
      // Handle Google OAuth for new Trinity Agent users
      if (account?.provider === 'google') {
        try {
          // Check if user exists or create new Trinity Agent trial user
          const existingUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            include: { organization: true }
          })
          
          if (!existingUser) {
            // Auto-create Trinity Agent trial user from Google OAuth
            const newUser = await prisma.user.create({
              data: {
                email: token.email as string,
                name: token.name as string,
                image: token.picture,
                role: 'USER',
                status: 'ACTIVE',
                permissions: ['trinity_agent_trial', 'dashboard_access']
              }
            })
            
            token.role = newUser.role
            token.organizationId = newUser.organizationId
            token.permissions = newUser.permissions
            token.trialStatus = 'TRIAL'
          } else {
            token.role = existingUser.role
            token.organizationId = existingUser.organizationId
            token.permissions = existingUser.permissions
          }
        } catch (error) {
          console.error('Google OAuth user creation error:', error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Add Trinity Agent data to session
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.permissions = token.permissions as string[]
        session.user.trialStatus = token.trialStatus as string
      }
      return session
    },
    
    async redirect({ url, baseUrl }) {
      // Custom redirect logic for Trinity Agent trial users
      if (url.includes('/signup') && url.includes('success')) {
        return `${baseUrl}/trial-dashboard`
      }
      
      // Redirect to trial dashboard for new Trinity Agent users
      if (url.includes('/auth/signin') || url === baseUrl) {
        return `${baseUrl}/trial-dashboard`
      }
      
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },
  
  pages: {
    signIn: '/signup',
    error: '/auth/error',
    newUser: '/trial-dashboard'
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log Trinity Agent trial sign-ins
      console.log('Trinity Agent sign-in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser
      })
      
      // Track Trinity Agent trial activation
      if (isNewUser && user.permissions?.includes('trinity_agent_trial')) {
        try {
          // Create welcome interaction with Oracle Agent
          const oracleAgent = await prisma.aIAgent.findUnique({
            where: { slug: 'oracle' }
          })
          
          if (oracleAgent) {
            await prisma.aIInteraction.create({
              data: {
                userId: user.id,
                organizationId: user.organizationId,
                agentId: oracleAgent.id,
                query: 'Welcome to Trinity Agents! Let me show you what I can do.',
                response: `Welcome ${user.name}! I'm Oracle, your AI business intelligence agent. During your 14-day trial, I can help you with revenue forecasting, customer analytics, and strategic insights. Try asking me about your business goals!`,
                confidence: 1.0,
                processingTime: 500,
                context: {
                  event: 'welcome_message',
                  trialStart: new Date().toISOString()
                },
                category: 'trial_welcome',
                tags: ['welcome', 'trial', 'oracle'],
                status: 'COMPLETED'
              }
            })
          }
        } catch (error) {
          console.error('Welcome interaction creation error:', error)
        }
      }
    },
    
    async session({ session, token }) {
      // Update last login for Trinity Agent users
      if (session.user?.id) {
        try {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { lastLoginAt: new Date() }
          })
        } catch (error) {
          console.error('Last login update error:', error)
        }
      }
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }