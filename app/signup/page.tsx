"use client"

import { useState } from 'react'
import { SignupForm } from '@/components/signup-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  const handleSignupSuccess = (data: any) => {
    setSignupSuccess(true)
    setUserData(data)
  }

  const handleSignupError = (error: string) => {
    alert(`Registration Error: ${error}`)
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[#37322F]">
                Welcome to x3o.ai, {userData?.user?.name}!
              </h1>
              <p className="text-[#605A57]">
                Your Trinity Agent trial is now active. You have 14 days of full enterprise access.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Your Trial Includes:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Oracle Analytics</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Sentinel Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Sage Optimization</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link 
                href={userData?.user?.accessUrl || '/trial-dashboard'}
                className="inline-flex items-center justify-center w-full h-12 bg-[#37322F] hover:bg-[#2A2520] text-white font-medium rounded-full transition-all duration-300 no-underline"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Access Your Trinity Agent Dashboard
              </Link>
              
              <p className="text-xs text-[#605A57]">
                Trial expires: {userData?.trialAccess?.expiresAt ? new Date(userData.trialAccess.expiresAt).toLocaleDateString() : '14 days from now'}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-[#605A57]">
                Check your email for detailed setup instructions and Trinity Agent documentation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Header */}
      <div className="border-b border-[rgba(55,50,47,0.12)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-[#37322F] no-underline">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xl font-semibold">x3o.ai</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                14-Day Free Trial
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Value Proposition */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-semibold text-[#37322F] leading-tight">
                Start Your Enterprise AI Automation Journey
              </h1>
              <p className="text-lg text-[#605A57]">
                Join enterprise leaders who have transformed their operations with Trinity Agents. 
                Get full access to Oracle Analytics, Sentinel Monitoring, and Sage Optimization.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#37322F]">What you'll get in your trial:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Oracle Analytics</div>
                    <div className="text-sm text-[#605A57]">Advanced business intelligence with predictive analytics and explainable AI decisions</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Sentinel Monitoring</div>
                    <div className="text-sm text-[#605A57]">24/7 autonomous system monitoring with intelligent optimization</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Sage Optimization</div>
                    <div className="text-sm text-[#605A57]">Intelligent process automation and content generation</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#37322F]/5 border border-[#37322F]/20 rounded-lg">
              <div className="text-sm text-[#37322F]">
                <strong>Enterprise ROI:</strong> Companies using Trinity Agents report 85% cost reduction 
                and 340% efficiency improvements within the first month.
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div>
            <SignupForm 
              onSuccess={handleSignupSuccess}
              onError={handleSignupError}
            />
          </div>
        </div>
      </div>
    </div>
  )
}