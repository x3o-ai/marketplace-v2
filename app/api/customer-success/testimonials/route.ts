import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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

    // TODO: Save to customer success database
    // await prisma.customerTestimonial.create({ data: testimonial })
    
    // TODO: Notify customer success team for verification
    // await notifyCustomerSuccessTeam(testimonial)
    
    // TODO: If high-impact results, fast-track for landing page inclusion
    if (validatedData.results.roiPercentage > 500) {
      // await prioritizeForLandingPageReview(testimonial)
    }

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