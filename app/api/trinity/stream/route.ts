import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { streamTrinityAgentResponse } from '@/lib/ai-streaming'
import { getTrialStatus } from '@/lib/trinity-agents'

const streamRequestSchema = z.object({
  userId: z.string(),
  agentType: z.enum(['oracle', 'sentinel', 'sage']),
  query: z.string().min(1),
  sessionId: z.string(),
  context: z.object({}).passthrough().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = streamRequestSchema.parse(body)

    // Verify trial access
    const trialStatus = await getTrialStatus(validatedData.userId)
    if (!trialStatus || trialStatus.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        message: 'Trial access expired or invalid'
      }, { status: 403 })
    }

    // Check usage limits
    if (trialStatus.usage[validatedData.agentType] >= trialStatus.limits[validatedData.agentType]) {
      return NextResponse.json({
        success: false,
        message: `${validatedData.agentType} trial limit reached`
      }, { status: 429 })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamTrinityAgentResponse(
            validatedData.agentType,
            validatedData.query,
            validatedData.context || {},
            validatedData.userId,
            validatedData.sessionId
          )) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          
          // Send completion event
          const completeEvent = `data: ${JSON.stringify({ type: 'complete', done: true })}\n\n`
          controller.enqueue(encoder.encode(completeEvent))
          
        } catch (error) {
          console.error('Streaming error:', error)
          const errorEvent = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
          })}\n\n`
          controller.enqueue(encoder.encode(errorEvent))
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Trinity streaming setup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to start streaming response'
    }, { status: 500 })
  }
}

// Health check for streaming service
export async function GET(request: NextRequest) {
  try {
    const streamingManager = new (await import('@/lib/ai-streaming')).default()
    const activeStreams = streamingManager.getActiveStreams()

    return NextResponse.json({
      success: true,
      status: 'healthy',
      activeStreams: activeStreams.length,
      streamIds: activeStreams,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}

// Cancel streaming endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('streamId')

    if (!streamId) {
      return NextResponse.json({
        success: false,
        message: 'Stream ID required'
      }, { status: 400 })
    }

    const streamingManager = new (await import('@/lib/ai-streaming')).default()
    const cancelled = streamingManager.cancelStream(streamId)

    return NextResponse.json({
      success: true,
      cancelled,
      message: cancelled ? 'Stream cancelled successfully' : 'Stream not found or already completed'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to cancel stream'
    }, { status: 500 })
  }
}