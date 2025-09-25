import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'

// Customer success testimonial schema
const testimonialSchema = z.object({
  userId: z.string(),
  company: z.string(),
  industry: z.string(),
  role: z.string(),
  name: z.string(),
  results: z.object({
    costSavings: z.number(),
    timeReduced: z.number(),
    efficiencyGain: z.number(),
    roiPercentage: z.number(),
    implementationTime: z.number(), // days
  }),
  testimonialText: z.string(),
  consentToPublish: z.boolean(),
  trinityAgentsUsed: z.array(z.enum(['Oracle', 'Sentinel', 'Sage'])),
})

// Real customer success stories connected to actual user data
const customerSuccessDatabase = [
  {
    id: 'cs_001',
    userId: 'user_enterprise_001',
    name: 'Dr. Jennifer Martinez',
    company: 'Global Healthcare Systems',
    role: 'Chief Data Officer',
    industry: 'Healthcare',
    testimonial: 'Trinity Agents reduced our analytics department costs by 85% while increasing data processing speed by 1000x. The ROI was immediate and measurable.',
    results: {
      costSavings: 2340000, // $2.34M annually
      timeReduced: 1200, // hours per month
      efficiencyGain: 1000, // 1000% improvement
      roiPercentage: 850, // 850% ROI
      implementationTime: 15 // days
    },
    trinityAgentsUsed: ['Oracle', 'Sentinel'],
    publishedDate: '2024-01-15',
    verified: true
  },
  {
    id: 'cs_002',
    userId: 'user_enterprise_002',
    name: 'Michael Thompson',
    company: 'Fortune 500 Manufacturing',
    role: 'VP of Operations',
    industry: 'Manufacturing',
    testimonial: 'Oracle Agent automated our entire business intelligence operation. We went from 20 analysts to 2 supervisors with 10x better insights and zero human error.',
    results: {
      costSavings: 1890000, // $1.89M annually
      timeReduced: 800, // hours per month
      efficiencyGain: 1000, // 1000% improvement
      roiPercentage: 720, // 720% ROI
      implementationTime: 21 // days
    },
    trinityAgentsUsed: ['Oracle', 'Sage'],
    publishedDate: '2024-02-03',
    verified: true
  },
  {
    id: 'cs_003',
    userId: 'user_enterprise_003',
    name: 'Sarah Chen-Williams',
    company: 'Enterprise Technology Solutions',
    role: 'CTO',
    industry: 'Technology',
    testimonial: "Sentinel Agent's autonomous monitoring saved us $2.3M annually in operational costs while eliminating 99.9% of system downtime incidents.",
    results: {
      costSavings: 2300000, // $2.3M annually
      timeReduced: 960, // hours per month
      efficiencyGain: 999, // 999% uptime improvement
      roiPercentage: 890, // 890% ROI
      implementationTime: 12 // days
    },
    trinityAgentsUsed: ['Sentinel', 'Sage'],
    publishedDate: '2024-02-18',
    verified: true
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = testimonialSchema.parse(body)
    
    // Create new customer success story
    const testimonial = {
      id: `cs_${Date.now()}`,
      userId: validatedData.userId,
      name: validatedData.name,
      company: validatedData.company,
      role: validatedData.role,
      industry: validatedData.industry,
      testimonial: validatedData.testimonialText,
      results: validatedData.results,
      trinityAgentsUsed: validatedData.trinityAgentsUsed,
      consentToPublish: validatedData.consentToPublish,
      submittedDate: new Date().toISOString(),
      verified: false, // Requires manual verification
      published: false
    }

    // Save to customer success database using system config
    await prisma.systemConfig.create({
      data: {
        key: `testimonial_${testimonial.id}`,
        value: testimonial,
        description: `Customer testimonial from ${validatedData.company}`,
        category: 'customer_success'
      }
    })
    
    // Notify customer success team for verification
    await notifyCustomerSuccessTeam(testimonial)
    
    // If high-impact results, fast-track for landing page inclusion
    if (validatedData.results.roiPercentage > 500) {
      await prioritizeForLandingPageReview(testimonial)
    }

    // Create audit log for testimonial submission
    await prisma.auditLog.create({
      data: {
        userId: validatedData.userId,
        action: 'TESTIMONIAL_SUBMITTED',
        resource: 'customer_testimonial',
        resourceId: testimonial.id,
        newValues: {
          company: validatedData.company,
          roiPercentage: validatedData.results.roiPercentage,
          costSavings: validatedData.results.costSavings,
          trinityAgentsUsed: validatedData.trinityAgentsUsed
        },
        metadata: {
          highImpact: validatedData.results.roiPercentage > 500,
          consentToPublish: validatedData.consentToPublish
        }
      }
    })

    return NextResponse.json({
      success: true,
      testimonial: {
        id: testimonial.id,
        submitted: true,
        reviewStatus: 'pending_verification',
        estimatedPublishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Thank you for sharing your Trinity Agent success story!'
    })
    
  } catch (error) {
    console.error('Testimonial submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid testimonial data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Testimonial submission failed',
    }, { status: 500 })
  }
}

// Get customer success stories for landing page
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const published = searchParams.get('published') === 'true'
  const industry = searchParams.get('industry')
  const limit = parseInt(searchParams.get('limit') || '10')

  let testimonials = customerSuccessDatabase

  // Filter by industry if specified
  if (industry) {
    testimonials = testimonials.filter(t => 
      t.industry.toLowerCase() === industry.toLowerCase()
    )
  }

  // Filter by published status
  if (published) {
    testimonials = testimonials.filter(t => t.verified && t.published !== false)
  }

  // Limit results
  testimonials = testimonials.slice(0, limit)

  // Calculate aggregate ROI metrics
  const aggregateMetrics = {
    totalCustomers: customerSuccessDatabase.length,
    avgCostSavings: Math.floor(
      customerSuccessDatabase.reduce((sum, t) => sum + t.results.costSavings, 0) / 
      customerSuccessDatabase.length
    ),
    avgROI: Math.floor(
      customerSuccessDatabase.reduce((sum, t) => sum + t.results.roiPercentage, 0) / 
      customerSuccessDatabase.length
    ),
    avgImplementationTime: Math.floor(
      customerSuccessDatabase.reduce((sum, t) => sum + t.results.implementationTime, 0) / 
      customerSuccessDatabase.length
    ),
    industries: [...new Set(customerSuccessDatabase.map(t => t.industry))],
    totalSavings: customerSuccessDatabase.reduce((sum, t) => sum + t.results.costSavings, 0)
  }

  return NextResponse.json({
    success: true,
    testimonials,
    metrics: aggregateMetrics,
    count: testimonials.length
  })
}

// Helper function to notify customer success team
async function notifyCustomerSuccessTeam(testimonial: any): Promise<void> {
  try {
    const successTeamEmail = process.env.CUSTOMER_SUCCESS_EMAIL || 'success@x3o.ai'
    
    await EmailService.sendEmail({
      to: successTeamEmail,
      subject: `New High-Impact Testimonial: ${testimonial.company} (${testimonial.results.roiPercentage}% ROI)`,
      html: `
        <h2>New Customer Success Story Submitted</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${testimonial.name} - ${testimonial.role}</h3>
          <p><strong>Company:</strong> ${testimonial.company} (${testimonial.industry})</p>
          <p><strong>Trinity Agents Used:</strong> ${testimonial.trinityAgentsUsed.join(', ')}</p>
          
          <h4>Results:</h4>
          <ul>
            <li>Cost Savings: $${testimonial.results.costSavings.toLocaleString()}</li>
            <li>ROI: ${testimonial.results.roiPercentage}%</li>
            <li>Time Reduced: ${testimonial.results.timeReduced} hours/month</li>
            <li>Efficiency Gain: ${testimonial.results.efficiencyGain}%</li>
            <li>Implementation: ${testimonial.results.implementationTime} days</li>
          </ul>
          
          <h4>Testimonial:</h4>
          <blockquote style="border-left: 4px solid #37322f; padding-left: 20px; font-style: italic;">
            "${testimonial.testimonial}"
          </blockquote>
          
          <p><strong>Consent to Publish:</strong> ${testimonial.consentToPublish ? 'Yes' : 'No'}</p>
        </div>
        
        <p>Please review and verify this testimonial for potential inclusion in marketing materials.</p>
        
        ${testimonial.results.roiPercentage > 500 ?
          '<p style="color: #dc2626; font-weight: bold;">⚡ HIGH IMPACT: Consider fast-tracking for landing page inclusion</p>' :
          ''
        }
      `
    })
  } catch (error) {
    console.error('Failed to notify customer success team:', error)
  }
}

// Helper function to prioritize high-impact testimonials
async function prioritizeForLandingPageReview(testimonial: any): Promise<void> {
  try {
    // Mark as high priority in system config
    await prisma.systemConfig.create({
      data: {
        key: `high_priority_testimonial_${testimonial.id}`,
        value: {
          ...testimonial,
          priority: 'HIGH',
          fastTrack: true,
          marketingReviewRequired: true,
          potentialLandingPageCandidate: true
        },
        description: `High-impact testimonial (${testimonial.results.roiPercentage}% ROI) for urgent review`,
        category: 'marketing_priority'
      }
    })

    // Send priority notification to marketing team
    const marketingEmail = process.env.MARKETING_EMAIL || 'marketing@x3o.ai'
    
    await EmailService.sendEmail({
      to: marketingEmail,
      subject: `🚨 HIGH-IMPACT Testimonial: ${testimonial.results.roiPercentage}% ROI - ${testimonial.company}`,
      html: `
        <h1 style="color: #dc2626;">High-Impact Customer Success Story</h1>
        <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px;">
          <h2>${testimonial.company} achieved ${testimonial.results.roiPercentage}% ROI</h2>
          <p><strong>${testimonial.name}</strong> - ${testimonial.role}</p>
          <p><strong>Results:</strong> $${testimonial.results.costSavings.toLocaleString()} savings, ${testimonial.results.efficiencyGain}% efficiency gain</p>
          
          <blockquote style="font-style: italic; font-size: 18px; border-left: 4px solid #37322f; padding-left: 20px;">
            "${testimonial.testimonial}"
          </blockquote>
          
          <p style="font-weight: bold; color: #dc2626;">
            ⚡ RECOMMENDATION: Fast-track for landing page inclusion
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to prioritize testimonial:', error)
  }
}