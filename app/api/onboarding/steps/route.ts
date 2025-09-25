import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OnboardingStepType } from '@/types/onboarding'

export async function GET(request: NextRequest) {
  try {
    const steps = await prisma.onboardingStep.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      steps
    })
  } catch (error) {
    console.error('Failed to fetch onboarding steps:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch onboarding steps'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      key,
      name,
      description,
      type,
      category,
      order,
      title,
      content,
      component,
      required = true,
      conditions,
      triggers,
      estimatedMinutes,
      skipAllowed = false,
      variants,
      active = true
    } = body

    const step = await prisma.onboardingStep.create({
      data: {
        key,
        name,
        description,
        type: type as OnboardingStepType,
        category,
        order,
        title,
        content,
        component,
        required,
        conditions,
        triggers,
        estimatedMinutes,
        skipAllowed,
        variants,
        active
      }
    })

    return NextResponse.json({
      success: true,
      step
    })
  } catch (error) {
    console.error('Failed to create onboarding step:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create onboarding step'
    }, { status: 500 })
  }
}