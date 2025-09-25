import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'

// Initialize Stripe only when needed to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })
}

// Subscription creation schema
const subscriptionSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  plan: z.enum(['creative', 'oracle', 'enterprise']),
  billingPeriod: z.enum(['monthly', 'annually']),
  paymentMethodId: z.string().optional(),
  company: z.string().optional(),
  seats: z.number().min(1).default(1),
})

// Trinity Agent pricing tiers
const pricingTiers = {
  creative: {
    monthly: 399,
    annually: 319, // 20% discount
    name: 'CreativeTrinity Studio',
    features: [
      'Sage Agent automation',
      'Content generation suite', 
      'Brand consistency management',
      'Campaign optimization',
      'Creative workflow automation'
    ]
  },
  oracle: {
    monthly: 699,
    annually: 559, // 20% discount
    name: 'OracleTrinity Analytics',
    features: [
      'Oracle Agent specialization',
      'Advanced predictive analytics',
      'Real-time business intelligence',
      'Custom dashboard creation',
      'Enterprise reporting suite'
    ]
  },
  enterprise: {
    monthly: 2499,
    annually: 1999, // 20% discount
    name: 'AgentTrinity Pro',
    features: [
      'Complete Trinity Agent suite',
      'Oracle + Sentinel + Sage agents',
      'Enterprise-grade security',
      'Dedicated success manager',
      '24/7 priority support',
      'Custom onboarding program'
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscriptionSchema.parse(body)
    
    const selectedPlan = pricingTiers[validatedData.plan]
    const priceAmount = selectedPlan[validatedData.billingPeriod] * validatedData.seats
    
    // Initialize Stripe for this request
    const stripe = getStripe()
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      include: { organization: true }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      }, { status: 404 })
    }

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email: validatedData.email,
      name: user.name || undefined,
      metadata: {
        userId: validatedData.userId,
        company: validatedData.company || user.organization?.name || '',
        plan: validatedData.plan,
        source: 'x3o_marketplace'
      }
    })

    // Create Stripe price if it doesn't exist (for demo purposes)
    const priceId = `price_${validatedData.plan}_${validatedData.billingPeriod}`
    let stripePrice
    
    try {
      stripePrice = await stripe.prices.retrieve(priceId)
    } catch (error) {
      // Create price if it doesn't exist
      const product = await stripe.products.create({
        name: selectedPlan.name,
        description: `Trinity Agent ${selectedPlan.name} - ${selectedPlan.features.slice(0, 3).join(', ')}`,
        metadata: {
          plan: validatedData.plan,
          features: selectedPlan.features.join(',')
        }
      })

      stripePrice = await stripe.prices.create({
        unit_amount: priceAmount * 100, // Stripe uses cents
        currency: 'usd',
        recurring: {
          interval: validatedData.billingPeriod === 'monthly' ? 'month' : 'year'
        },
        product: product.id,
        metadata: {
          plan: validatedData.plan,
          billing_period: validatedData.billingPeriod
        }
      })
    }

    // Create subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: stripePrice.id,
        quantity: validatedData.seats
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: validatedData.userId,
        plan: validatedData.plan,
        company: validatedData.company || '',
        source: 'x3o_marketplace'
      }
    })

    const subscription = {
      id: stripeSubscription.id,
      customer: customer.id,
      status: stripeSubscription.status,
      plan: {
        id: `${validatedData.plan}_${validatedData.billingPeriod}`,
        name: selectedPlan.name,
        amount: priceAmount,
        currency: 'usd',
        interval: validatedData.billingPeriod,
        seats: validatedData.seats
      },
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      features: selectedPlan.features,
      created: new Date(stripeSubscription.created * 1000).toISOString()
    }

    // TODO: Save subscription to database
    // await prisma.subscription.create({
    //   data: {
    //     userId: validatedData.userId,
    //     stripeSubscriptionId: subscription.id,
    //     stripeCustomerId: customer.id,
    //     plan: validatedData.plan,
    //     status: 'active',
    //     seats: validatedData.seats,
    //     currentPeriodStart: subscription.currentPeriodStart,
    //     currentPeriodEnd: subscription.currentPeriodEnd
    //   }
    // })

    // TODO: Send welcome email for paid subscription
    // await sendSubscriptionWelcomeEmail(validatedData.email, subscription)

    // TODO: Provision Trinity Agent access for paid user
    // await provisionPaidAccess(validatedData.userId, validatedData.plan)

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription created successfully!',
      accessUrl: '/dashboard',
      paymentIntent: {
        // TODO: Return actual Stripe payment intent for client-side confirmation
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Subscription creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid subscription data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Subscription creation failed. Please try again.',
    }, { status: 500 })
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({
      success: false,
      message: 'User ID required'
    }, { status: 400 })
  }

  // TODO: Get actual subscription from database
  const subscription = {
    userId,
    status: 'trial', // trial, active, cancelled, past_due
    plan: 'oracle',
    seats: 1,
    trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    nextBilling: null,
    features: pricingTiers.oracle.features
  }

  return NextResponse.json({
    success: true,
    subscription
  })
}

// Provision Trinity Agent access for paid users
async function provisionPaidAccess(userId: string, plan: string, seats: number): Promise<void> {
  try {
    // Update user permissions based on plan
    let permissions: string[] = []
    
    switch (plan) {
      case 'creative':
        permissions = [
          'sage_agent_full',
          'content_generation_unlimited',
          'brand_management',
          'campaign_optimization',
          'creative_workflows'
        ]
        break
      case 'oracle':
        permissions = [
          'oracle_agent_full',
          'advanced_analytics',
          'predictive_modeling',
          'business_intelligence',
          'custom_dashboards',
          'enterprise_reporting'
        ]
        break
      case 'enterprise':
        permissions = [
          'trinity_agent_full',
          'oracle_agent_full',
          'sentinel_agent_full',
          'sage_agent_full',
          'enterprise_admin',
          'unlimited_queries',
          'priority_support',
          'custom_integrations',
          'dedicated_success_manager'
        ]
        break
    }

    // Update user with paid permissions
    await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          set: permissions
        },
        // Remove trial permission and add paid permissions
        status: 'ACTIVE'
      }
    })

    // Create audit log for permission change
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_ACTIVATED',
        resource: 'subscription',
        newValues: {
          plan,
          seats,
          permissions,
          activatedAt: new Date().toISOString()
        },
        metadata: {
          source: 'billing_system',
          subscriptionUpgrade: true
        }
      }
    })

    console.log(`Provisioned ${plan} access for user ${userId} with ${seats} seats`)
  } catch (error) {
    console.error('Failed to provision paid access:', error)
    throw error
  }
}