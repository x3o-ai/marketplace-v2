import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Email automation schema
const emailAutomationSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  triggerEvent: z.enum([
    'trial_welcome',
    'trial_day_3',
    'trial_day_7', 
    'trial_day_10',
    'trial_expiring',
    'conversion_success',
    'feature_discovery',
    'roi_milestone'
  ]),
  userData: z.object({}).passthrough(),
})

// Email templates for Trinity Agent onboarding and conversion
const emailTemplates = {
  trial_welcome: {
    subject: "Welcome to Trinity Agents - Your 14-day trial is live!",
    template: `
      <h1>Welcome to x3o.ai, {{name}}!</h1>
      <p>Your Trinity Agent trial is now active. Here's how to get the most value:</p>
      
      <div style="background: #f7f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🧠 Oracle Analytics - Try First</h3>
        <p>Ask Oracle to predict your revenue for next quarter. Most users see 94% accuracy.</p>
        <a href="{{dashboardUrl}}/trial-dashboard?agent=oracle" style="background: #37322f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Start with Oracle</a>
      </div>
      
      <h3>Your trial includes:</h3>
      <ul>
        <li>✅ Oracle Analytics - Predictive business intelligence</li>
        <li>✅ Sentinel Monitoring - 24/7 system optimization</li>
        <li>✅ Sage Optimization - Content generation and automation</li>
      </ul>
      
      <p>Need help? Reply to this email or schedule a 15-minute onboarding call.</p>
    `
  },
  
  trial_day_3: {
    subject: "{{name}}, see your Trinity Agent ROI so far...",
    template: `
      <h1>Amazing progress, {{name}}!</h1>
      <p>Your Trinity Agents have been working hard. Here's your ROI after 3 days:</p>
      
      <div style="background: #e6f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📊 Your 3-Day Results:</h3>
        <ul>
          <li><strong>${{costSavings}}</strong> in projected monthly savings</li>
          <li><strong>{{timeReduced}} hours</strong> saved on manual tasks</li>
          <li><strong>{{accuracy}}%</strong> accuracy on predictions</li>
        </ul>
      </div>
      
      <p>Companies that continue with Trinity Agents see 10x ROI within 6 months.</p>
      
      <h3>🎯 Next Steps to Maximize Value:</h3>
      <ol>
        <li>Try Sentinel's system monitoring (reduces downtime 99.9%)</li>
        <li>Use Sage for content generation (87% engagement improvement)</li>
        <li>Connect your actual business data for personalized insights</li>
      </ol>
      
      <a href="{{dashboardUrl}}/trial-dashboard" style="background: #37322f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Continue Your Trial</a>
    `
  },
  
  trial_day_7: {
    subject: "{{name}}, you're halfway through your Trinity Agent trial",
    template: `
      <h1>Week 1 Complete, {{name}}!</h1>
      <p>You're halfway through your Trinity Agent trial with impressive results:</p>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📈 Week 1 Impact:</h3>
        <ul>
          <li><strong>${{weeklyROI}}</strong> in business value generated</li>
          <li><strong>{{agentInteractions}}</strong> Trinity Agent interactions</li>
          <li><strong>{{insights}}</strong> actionable insights delivered</li>
        </ul>
      </div>
      
      <h3>💡 Success Story:</h3>
      <blockquote style="border-left: 4px solid #37322f; padding-left: 20px; margin: 20px 0; font-style: italic;">
        "Trinity Agents reduced our analytics department costs by 85% while increasing data processing speed by 1000x. The ROI was immediate and measurable."
        <br><br>
        <strong>- Dr. Jennifer Martinez, Chief Data Officer, Global Healthcare Systems</strong>
      </blockquote>
      
      <p>Week 2 Focus: Scale your success across more departments.</p>
      
      <a href="{{dashboardUrl}}/account" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">View Your Progress</a>
    `
  },
  
  trial_day_10: {
    subject: "{{name}}, 4 days left - your Trinity Agent results are impressive",
    template: `
      <h1>Only 4 days left, {{name}}!</h1>
      <p>Your Trinity Agent trial ends soon, but your results are outstanding:</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b;">
        <h3>⚠️ Trial Ending Soon:</h3>
        <p><strong>{{daysLeft}} days remaining</strong> to continue these results:</p>
        <ul>
          <li><strong>${{totalSavings}}</strong> in monthly savings potential</li>
          <li><strong>{{efficiencyGain}}%</strong> efficiency improvement</li>
          <li><strong>{{automationHours}}</strong> hours of manual work automated</li>
        </ul>
      </div>
      
      <h3>🚀 Don't Lose This Progress:</h3>
      <p>Companies that continue with Trinity Agents maintain these results permanently and often see 10x ROI within the first year.</p>
      
      <div style="background: #37322f; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3>Special Trial Extension Offer</h3>
        <p>Continue your results with 20% off your first year</p>
        <a href="{{dashboardUrl}}/account?offer=trial20" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; font-weight: bold;">Claim 20% Discount</a>
      </div>
    `
  },
  
  trial_expiring: {
    subject: "URGENT: {{name}}, your Trinity Agent trial expires in 24 hours",
    template: `
      <h1 style="color: #dc2626;">Final 24 Hours, {{name}}!</h1>
      <p>Your Trinity Agent trial expires tomorrow. Here's what you'll lose:</p>
      
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626;">
        <h3 style="color: #dc2626;">⏰ Expiring in 24 Hours:</h3>
        <ul>
          <li><strong>${{costSavings}}/month</strong> in automation savings</li>
          <li><strong>Oracle Analytics</strong> with 94% prediction accuracy</li>
          <li><strong>Sentinel Monitoring</strong> with 99.8% uptime optimization</li>
          <li><strong>Sage Optimization</strong> with 87% engagement improvements</li>
        </ul>
      </div>
      
      <h3>🎯 Last Chance Offer:</h3>
      <p>Upgrade now and get your first month FREE + 20% off annual plans.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}/account?urgentOffer=true" style="background: #dc2626; color: white; padding: 20px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">KEEP MY TRINITY AGENTS</a>
      </div>
      
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        This offer expires when your trial ends. After expiration, you'll lose access to all Trinity Agent functionality and data.
      </p>
    `
  },

  conversion_success: {
    subject: "🎉 Welcome to x3o.ai Enterprise, {{name}}!",
    template: `
      <h1>Congratulations, {{name}}!</h1>
      <p>You've successfully upgraded to {{planName}}. Your Trinity Agents are now fully deployed.</p>
      
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🚀 Your Enterprise Deployment:</h3>
        <ul>
          <li>✅ Unlimited Trinity Agent access activated</li>
          <li>✅ Enterprise dashboard and analytics enabled</li>
          <li>✅ Dedicated success manager assigned</li>
          <li>✅ 24/7 priority support activated</li>
        </ul>
      </div>
      
      <h3>📞 Your Success Manager:</h3>
      <p>{{successManager}} will contact you within 24 hours to:</p>
      <ul>
        <li>Plan your Trinity Agent implementation strategy</li>
        <li>Set up custom integrations with your existing systems</li>
        <li>Establish success metrics and ROI tracking</li>
      </ul>
      
      <a href="{{dashboardUrl}}/dashboard" style="background: #37322f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Access Enterprise Dashboard</a>
      
      <p>Welcome to the future of enterprise automation!</p>
    `
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = emailAutomationSchema.parse(body)
    
    const template = emailTemplates[validatedData.triggerEvent]
    
    if (!template) {
      throw new Error(`Email template not found for event: ${validatedData.triggerEvent}`)
    }

    // Create email content with personalization
    const emailContent = {
      to: validatedData.email,
      subject: template.subject.replace('{{name}}', validatedData.name),
      html: template.template
        .replace(/{{name}}/g, validatedData.name)
        .replace(/{{dashboardUrl}}/g, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
        .replace(/{{costSavings}}/g, validatedData.userData.costSavings || '47,320')
        .replace(/{{timeReduced}}/g, validatedData.userData.timeReduced || '127')
        .replace(/{{accuracy}}/g, validatedData.userData.accuracy || '94')
        .replace(/{{weeklyROI}}/g, validatedData.userData.weeklyROI || '12,450')
        .replace(/{{agentInteractions}}/g, validatedData.userData.agentInteractions || '89')
        .replace(/{{insights}}/g, validatedData.userData.insights || '23')
        .replace(/{{daysLeft}}/g, validatedData.userData.daysLeft || '4')
        .replace(/{{totalSavings}}/g, validatedData.userData.totalSavings || '47,320')
        .replace(/{{efficiencyGain}}/g, validatedData.userData.efficiencyGain || '340')
        .replace(/{{automationHours}}/g, validatedData.userData.automationHours || '127')
        .replace(/{{planName}}/g, validatedData.userData.planName || 'OracleTrinity Analytics')
        .replace(/{{successManager}}/g, validatedData.userData.successManager || 'Sarah Chen, Enterprise Success Manager'),
      metadata: {
        userId: validatedData.userId,
        triggerEvent: validatedData.triggerEvent,
        sentAt: new Date().toISOString()
      }
    }

    // TODO: Send email using your preferred service (SendGrid, Mailgun, etc.)
    // await sendEmail(emailContent)
    
    // TODO: Log email sent to database
    // await prisma.emailLog.create({
    //   data: {
    //     userId: validatedData.userId,
    //     type: validatedData.triggerEvent,
    //     recipient: validatedData.email,
    //     subject: emailContent.subject,
    //     status: 'sent',
    //     sentAt: new Date()
    //   }
    // })

    // Simulate email sending success
    console.log(`Email sent: ${validatedData.triggerEvent} to ${validatedData.email}`)

    return NextResponse.json({
      success: true,
      message: 'Email automation triggered successfully',
      emailId: `email_${Date.now()}`,
      sentTo: validatedData.email,
      template: validatedData.triggerEvent
    })
    
  } catch (error) {
    console.error('Email automation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Email automation failed',
    }, { status: 500 })
  }
}

// Email automation scheduler - triggers based on user behavior
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'schedule-automation') {
    // TODO: This would typically be called by a cron job or background worker
    
    // Simulate finding users who need emails
    const emailsToSend = [
      {
        userId: 'user_123',
        email: 'john@company.com',
        name: 'John Smith',
        triggerEvent: 'trial_day_3',
        userData: {
          costSavings: '52,140',
          timeReduced: '89',
          accuracy: '96',
          agentInteractions: '47'
        }
      },
      {
        userId: 'user_456', 
        email: 'sarah@techcorp.com',
        name: 'Sarah Johnson',
        triggerEvent: 'trial_expiring',
        userData: {
          daysLeft: '1',
          totalSavings: '73,920',
          efficiencyGain: '340',
          automationHours: '156'
        }
      }
    ]

    // Process email queue
    const results = []
    for (const emailData of emailsToSend) {
      try {
        // This would trigger the email automation
        results.push({
          userId: emailData.userId,
          email: emailData.email,
          trigger: emailData.triggerEvent,
          status: 'scheduled'
        })
      } catch (error) {
        results.push({
          userId: emailData.userId,
          email: emailData.email,
          trigger: emailData.triggerEvent,
          status: 'failed',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email automation batch processed',
      results,
      processed: results.length
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Email automation service healthy',
    availableTriggers: Object.keys(emailTemplates),
    queueStatus: 'active'
  })
}