"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Shield, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OnboardingStepProps } from '@/types/onboarding'

export function WelcomeStep({ step, onComplete, isFirst, isLast }: OnboardingStepProps) {
  const [hasWatched, setHasWatched] = useState(false)

  const handleGetStarted = () => {
    onComplete({
      welcomed: true,
      timestamp: new Date().toISOString()
    })
  }

  const handleWatchIntro = () => {
    setHasWatched(true)
    // In a real implementation, this would track video completion
    setTimeout(() => {
      // Auto-advance after "watching" intro
    }, 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#37322F] to-[#2A2520] rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-[#37322F] mb-4">
          Welcome to the Future of Enterprise AI
        </h1>
        
        <p className="text-xl text-[#605A57] max-w-3xl mx-auto leading-relaxed">
          Trinity Agents will transform how your business operates. In the next few minutes, 
          we'll show you how Oracle Analytics, Sentinel Monitoring, and Sage Optimization 
          can deliver measurable ROI from day one.
        </p>

        <div className="flex items-center justify-center gap-6 text-sm text-[#605A57] mt-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>5-minute setup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>No technical knowledge required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Immediate results</span>
          </div>
        </div>
      </motion.div>

      {/* Trinity Agents Preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
      >
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Oracle Analytics</h3>
            <p className="text-sm text-green-700">
              Predictive business intelligence with 94% accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Sentinel Monitoring</h3>
            <p className="text-sm text-blue-700">
              24/7 autonomous optimization with 99.8% uptime
            </p>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-purple-900 mb-2">Sage Optimization</h3>
            <p className="text-sm text-purple-700">
              Content generation with 87% engagement improvement
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Success Stories */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#37322F] rounded-xl p-8 text-white"
      >
        <h3 className="text-xl font-semibold mb-6 text-center">
          Join 500+ Enterprise Leaders Already Using Trinity Agents
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
            <div className="text-sm opacity-90">Average cost reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">340%</div>
            <div className="text-sm opacity-90">Efficiency improvement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">30 days</div>
            <div className="text-sm opacity-90">Average ROI realization</div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center space-y-6"
      >
        <div className="space-y-4">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4 text-lg font-semibold"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started - It's Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <p className="text-sm text-[#605A57]">
            14-day trial • No credit card required • Setup in 5 minutes
          </p>
        </div>

        {!hasWatched && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleWatchIntro}
              className="text-[#37322F] border-[#37322F] hover:bg-[#37322F] hover:text-white"
            >
              Watch 2-minute intro video first
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}