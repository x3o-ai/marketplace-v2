import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, testType = 'basic' } = body

    if (!to) {
      return NextResponse.json({
        success: false,
        message: 'Email recipient required'
      }, { status: 400 })
    }

    let emailResult
    
    if (testType === 'welcome') {
      // Test welcome email template
      emailResult = await EmailService.sendTrialWelcomeEmail(
        to,
        'Test User',
        'https://x3o.ai'
      )
    } else {
      // Test basic email
      emailResult = await EmailService.sendEmail({
        to,
        subject: 'SendGrid Test Email from x3o.ai',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #37322F;">SendGrid Test Successful! ✅</h1>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0;">🎉 Email System Working</h3>
              <p style="color: #1e40af; margin-bottom: 0;">
                Your x3o.ai marketplace email system is now operational and ready for production use!
              </p>
            </div>
            
            <h3 style="color: #37322F;">✅ Verified Systems:</h3>
            <ul>
              <li>SendGrid API integration</li>
              <li>Email template rendering</li>
              <li>Production email delivery</li>
              <li>HTML email formatting</li>
            </ul>
            
            <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #065f46; margin: 0;">
                <strong>Next:</strong> Your billing system is ready to send welcome emails, payment confirmations, and trial automation sequences.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Test sent at: ${new Date().toISOString()}<br>
              From: x3o.ai Trinity Agents Billing System
            </p>
          </div>
        `,
        text: `SendGrid Test Successful! Your x3o.ai email system is operational. Test sent at: ${new Date().toISOString()}`
      })
    }

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success 
        ? 'Test email sent successfully!' 
        : 'Email sending failed',
      details: {
        recipient: to,
        testType,
        messageId: emailResult.success ? 'sent' : undefined,
        error: emailResult.error,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('SendGrid test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'SendGrid test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString(),
        environment: {
          hasSendGridKey: !!process.env.SENDGRID_API_KEY,
          hasEmailFrom: !!process.env.EMAIL_FROM
        }
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'SendGrid Test Endpoint Ready',
    instructions: {
      method: 'POST',
      body: {
        to: 'your-email@example.com',
        testType: 'basic' // or 'welcome'
      }
    },
    environment: {
      sendGridConfigured: !!process.env.SENDGRID_API_KEY,
      emailFromConfigured: !!process.env.EMAIL_FROM,
      timestamp: new Date().toISOString()
    }
  })
}