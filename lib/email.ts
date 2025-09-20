import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Email configuration
const EMAIL_CONFIG = {
  from: {
    email: process.env.EMAIL_FROM || 'noreply@x3o.ai',
    name: process.env.EMAIL_FROM_NAME || 'x3o.ai Trinity Agents'
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@x3o.ai'
}

// Email service functions
export class EmailService {
  private static validateConfig(): void {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required')
    }
  }

  static async sendEmail(params: {
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.validateConfig()

      const msg = {
        to: params.to,
        from: EMAIL_CONFIG.from,
        replyTo: EMAIL_CONFIG.replyTo,
        subject: params.subject,
        html: params.html,
        text: params.text || params.subject,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
          subscriptionTracking: { enable: false }
        }
      }

      const [response] = await sgMail.send(msg)
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] as string
      }
    } catch (error: any) {
      console.error('SendGrid email error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }
  }

  static async sendTrialWelcomeEmail(
    userEmail: string, 
    userName: string, 
    dashboardUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://x3o.ai'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendEmail({
        to: userEmail,
        subject: `Welcome to Trinity Agents, ${userName}! Your 14-day trial is live`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #37322F;">Welcome to x3o.ai, ${userName}!</h1>
              <p>Your Trinity Agent trial is now active. Start with Oracle Analytics for 94% accurate revenue predictions.</p>
              <div style="background: #f7f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>🧠 Oracle Analytics - Try First</h3>
                <a href="${dashboardUrl}/trial-dashboard" style="background: #37322F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start with Oracle →</a>
              </div>
              <p>Your trial includes Oracle Analytics, Sentinel Monitoring, and Sage Optimization.</p>
            </body>
          </html>
        `
      })

      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async sendSubscriptionWelcomeEmail(
    userEmail: string,
    subscription: {
      userId: string
      planName: string
      amount: number
      subscriptionId: string
    },
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendEmail({
        to: userEmail,
        subject: `🎉 Welcome to x3o.ai Enterprise, ${userName}!`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #37322F;">Congratulations, ${userName}!</h1>
              <p>You've successfully upgraded to <strong>${subscription.planName}</strong>. Your Trinity Agents are now fully deployed.</p>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>🚀 Your Enterprise Deployment is Active</h3>
                <ul>
                  <li>✅ Unlimited Trinity Agent access activated</li>
                  <li>✅ Enterprise dashboard and analytics enabled</li>
                  <li>✅ 24/7 priority support activated</li>
                </ul>
              </div>
              <p>Welcome to the future of enterprise automation!</p>
            </body>
          </html>
        `
      })

      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Utility function for logging emails to database
export async function logEmail(emailData: {
  userId?: string
  organizationId?: string
  type: string
  recipient: string
  subject: string
  content?: string
  provider: string
  providerMessageId?: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  error?: string
}) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.emailLog.create({
      data: {
        userId: emailData.userId,
        organizationId: emailData.organizationId,
        type: emailData.type as any,
        recipient: emailData.recipient,
        subject: emailData.subject,
        content: emailData.content,
        provider: emailData.provider,
        providerMessageId: emailData.providerMessageId,
        status: emailData.status as any,
        error: emailData.error,
        sentAt: emailData.status === 'SENT' ? new Date() : null
      }
    })
  } catch (error) {
    console.error('Failed to log email:', error)
  }
}