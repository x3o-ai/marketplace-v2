import { prisma } from './prisma'
import Stripe from 'stripe'
import { EmailService } from './email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export interface SubscriptionChange {
  type: 'UPGRADE' | 'DOWNGRADE' | 'CANCEL' | 'REACTIVATE' | 'SEAT_CHANGE'
  fromPlan: string
  toPlan: string
  effectiveDate: Date
  prorationAmount?: number
}

export class BillingManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Handle subscription lifecycle events
  async processSubscriptionChange(change: SubscriptionChange): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIALING'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user || !user.subscriptions[0]) {
      throw new Error('No active subscription found')
    }

    const subscription = user.subscriptions[0]

    switch (change.type) {
      case 'UPGRADE':
        await this.handleUpgrade(subscription, change)
        break
      case 'DOWNGRADE':
        await this.handleDowngrade(subscription, change)
        break
      case 'CANCEL':
        await this.handleCancellation(subscription, change)
        break
      case 'REACTIVATE':
        await this.handleReactivation(subscription, change)
        break
      case 'SEAT_CHANGE':
        await this.handleSeatChange(subscription, change)
        break
    }

    // Create audit log for subscription change
    await prisma.auditLog.create({
      data: {
        userId: this.userId,
        action: `SUBSCRIPTION_${change.type}`,
        resource: 'subscription',
        resourceId: subscription.id,
        oldValues: {
          plan: change.fromPlan,
          status: subscription.status
        },
        newValues: {
          plan: change.toPlan,
          effectiveDate: change.effectiveDate,
          prorationAmount: change.prorationAmount
        },
        metadata: {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          changeType: change.type
        }
      }
    })
  }

  // Handle subscription upgrades
  private async handleUpgrade(subscription: any, change: SubscriptionChange): Promise<void> {
    // Update Stripe subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: subscription.stripeSubscriptionId, // This would be the subscription item ID
        price: this.getPriceId(change.toPlan, subscription.interval),
      }],
      proration_behavior: 'create_prorations'
    })

    // Update database subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: change.toPlan.toUpperCase() as any,
        amount: this.getPlanAmount(change.toPlan, subscription.interval),
        metadata: {
          ...subscription.metadata,
          previousPlan: change.fromPlan,
          upgradeDate: new Date().toISOString()
        }
      }
    })

    // Update user permissions
    await this.updateUserPermissions(change.toPlan)

    // Send upgrade confirmation email
    await this.sendUpgradeConfirmationEmail(change)
  }

  // Handle subscription downgrades
  private async handleDowngrade(subscription: any, change: SubscriptionChange): Promise<void> {
    // Schedule downgrade for next billing period
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: subscription.stripeSubscriptionId,
        price: this.getPriceId(change.toPlan, subscription.interval),
      }],
      proration_behavior: 'none' // No immediate charge for downgrade
    })

    // Update database with scheduled change
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        metadata: {
          ...subscription.metadata,
          scheduledDowngrade: {
            newPlan: change.toPlan,
            effectiveDate: change.effectiveDate.toISOString(),
            previousPlan: change.fromPlan
          }
        }
      }
    })

    // Send downgrade notification
    await this.sendDowngradeNotificationEmail(change)
  }

  // Handle subscription cancellations
  private async handleCancellation(subscription: any, change: SubscriptionChange): Promise<void> {
    // Cancel at period end to honor remaining paid time
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    })

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        metadata: {
          ...subscription.metadata,
          cancellationDate: new Date().toISOString(),
          cancellationReason: change.type
        }
      }
    })

    // Send cancellation confirmation
    await this.sendCancellationEmail(subscription)
  }

  // Generate and send invoices
  async generateInvoice(subscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Get Stripe invoice
    const stripeInvoices = await stripe.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      limit: 1
    })

    if (stripeInvoices.data.length === 0) {
      throw new Error('No invoices found for subscription')
    }

    const stripeInvoice = stripeInvoices.data[0]

    // Save invoice to database
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        organizationId: subscription.organizationId,
        stripeInvoiceId: stripeInvoice.id,
        invoiceNumber: stripeInvoice.number || `INV-${Date.now()}`,
        amount: stripeInvoice.total / 100, // Convert from cents
        tax: (stripeInvoice.tax || 0) / 100,
        currency: stripeInvoice.currency.toUpperCase(),
        status: stripeInvoice.status?.toUpperCase() as any,
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
        paidAt: stripeInvoice.status_transitions?.paid_at ? new Date(stripeInvoice.status_transitions.paid_at * 1000) : null,
        invoiceUrl: stripeInvoice.hosted_invoice_url,
        invoicePdf: stripeInvoice.invoice_pdf
      }
    })

    // Send invoice email if required
    if (stripeInvoice.status === 'open') {
      await this.sendInvoiceEmail(invoice, subscription.user)
    }
  }

  // Handle payment failures
  async handlePaymentFailure(subscriptionId: string, failureReason: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'PAST_DUE',
        metadata: {
          ...subscription.metadata,
          lastPaymentFailure: {
            date: new Date().toISOString(),
            reason: failureReason
          }
        }
      }
    })

    // Send payment failure email
    await EmailService.sendEmail({
      to: subscription.user.email,
      subject: 'Payment Failed - Action Required for x3o.ai Trinity Agents',
      html: `
        <h2>Payment Update Required</h2>
        <p>Hi ${subscription.user.name},</p>
        
        <p>We had trouble processing your payment for your Trinity Agent subscription.</p>
        
        <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>⚠️ Action Required</h3>
          <p>Please update your payment method to continue accessing Trinity Agents.</p>
          <p><strong>Reason:</strong> ${failureReason}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/billing" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Update Payment Method
        </a>
        
        <p>Your Trinity Agent access will be suspended if payment is not updated within 7 days.</p>
      `
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: subscription.userId,
        action: 'PAYMENT_FAILED',
        resource: 'subscription',
        resourceId: subscription.id,
        metadata: {
          failureReason,
          subscriptionStatus: 'PAST_DUE'
        }
      }
    })
  }

  // Helper methods
  private getPriceId(plan: string, interval: string): string {
    return `price_${plan}_${interval}`
  }

  private getPlanAmount(plan: string, interval: string): number {
    const pricing = {
      creative: { monthly: 399, annually: 319 },
      oracle: { monthly: 699, annually: 559 },
      enterprise: { monthly: 2499, annually: 1999 }
    }
    
    return pricing[plan as keyof typeof pricing]?.[interval as keyof typeof pricing.creative] || 0
  }

  private async updateUserPermissions(plan: string): Promise<void> {
    let permissions: string[] = []
    
    switch (plan) {
      case 'creative':
        permissions = ['sage_agent_full', 'content_generation_unlimited']
        break
      case 'oracle':
        permissions = ['oracle_agent_full', 'advanced_analytics']
        break
      case 'enterprise':
        permissions = ['trinity_agent_full', 'oracle_agent_full', 'sentinel_agent_full', 'sage_agent_full']
        break
    }

    await prisma.user.update({
      where: { id: this.userId },
      data: { permissions: { set: permissions } }
    })
  }

  private async sendUpgradeConfirmationEmail(change: SubscriptionChange): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: this.userId } })
    if (!user) return

    await EmailService.sendEmail({
      to: user.email,
      subject: `Subscription Upgraded - Welcome to ${change.toPlan} Plan!`,
      html: `
        <h2>Upgrade Successful!</h2>
        <p>Hi ${user.name},</p>
        <p>Your Trinity Agent subscription has been successfully upgraded to the ${change.toPlan} plan.</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🚀 Your New Features Are Active</h3>
          <p>You now have access to enhanced Trinity Agent capabilities.</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #37322f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">
          Explore Your Upgraded Features
        </a>
      `
    })
  }

  private async sendDowngradeNotificationEmail(change: SubscriptionChange): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: this.userId } })
    if (!user) return

    await EmailService.sendEmail({
      to: user.email,
      subject: 'Subscription Change Scheduled',
      html: `
        <h2>Subscription Change Confirmed</h2>
        <p>Hi ${user.name},</p>
        <p>Your subscription will change to the ${change.toPlan} plan on ${change.effectiveDate.toDateString()}.</p>
        
        <p>You'll continue to have access to all current features until ${change.effectiveDate.toDateString()}.</p>
      `
    })
  }

  private async sendCancellationEmail(subscription: any): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: this.userId } })
    if (!user) return

    await EmailService.sendEmail({
      to: user.email,
      subject: 'Subscription Cancelled - We\'ll Miss You',
      html: `
        <h2>Subscription Cancelled</h2>
        <p>Hi ${user.name},</p>
        <p>Your Trinity Agent subscription has been cancelled as requested.</p>
        
        <p>You'll continue to have access until ${subscription.currentPeriodEnd}.</p>
        
        <p>We'd love to have you back! If you change your mind, you can reactivate anytime.</p>
      `
    })
  }

  private async sendInvoiceEmail(invoice: any, user: any): Promise<void> {
    await EmailService.sendEmail({
      to: user.email,
      subject: `Invoice ${invoice.invoiceNumber} - Trinity Agent Subscription`,
      html: `
        <h2>Your Trinity Agent Invoice</h2>
        <p>Hi ${user.name},</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Amount:</strong> $${invoice.amount}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate?.toDateString() || 'Immediate'}</p>
        </div>
        
        <a href="${invoice.invoiceUrl}" style="background: #37322f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">
          View Invoice
        </a>
      `
    })
  }
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`Unhandled Stripe webhook event: ${event.type}`)
    }
  } catch (error) {
    console.error('Stripe webhook error:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (subscription) {
    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        organizationId: subscription.organizationId,
        stripePaymentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCEEDED',
        paidAt: new Date()
      }
    })

    // Update subscription status if it was past due
    if (subscription.status === 'PAST_DUE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      })
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { user: true }
  })

  if (subscription) {
    const billingManager = new BillingManager(subscription.userId)
    await billingManager.handlePaymentFailure(
      subscription.id, 
      'Payment method declined'
    )
  }
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id }
  })

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: stripeSubscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      }
    })
  }
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id }
  })

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date()
      }
    })
  }
}

export default BillingManager