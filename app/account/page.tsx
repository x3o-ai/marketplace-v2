"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain,
  Shield,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  Star,
  Award,
  Target,
  Zap
} from 'lucide-react'
import Link from 'next/link'

export default function AccountPage() {
  const [user, setUser] = useState({
    name: 'John Smith',
    email: 'john@company.com',
    company: 'TechCorp Inc',
    trialDaysLeft: 11,
    trialStarted: '2024-01-15',
    plan: 'trial'
  })

  const [metrics, setMetrics] = useState({
    costSavings: 47320,
    timeReduced: 127,
    accuracyImproved: 94,
    efficiencyGain: 340,
    queriesUsed: 89,
    insights: 23,
    optimizations: 15
  })

  const conversionIncentives = [
    {
      title: 'Continue Your ROI',
      description: `You're on track to save $${metrics.costSavings.toLocaleString()}/month. Don't lose this momentum.`,
      action: 'Upgrade Now',
      urgency: 'high'
    },
    {
      title: 'Unlock Full Potential',
      description: 'Your trial shows 340% efficiency gains. Imagine the impact with unlimited access.',
      action: 'See Full Plans',
      urgency: 'medium'
    },
    {
      title: 'Team Expansion Ready',
      description: 'Add your team members and multiply these results across your organization.',
      action: 'Add Team Members',
      urgency: 'low'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Header */}
      <div className="border-b border-[rgba(55,50,47,0.12)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-semibold text-[#37322F] no-underline">x3o.ai</Link>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {user.trialDaysLeft} days left
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#605A57]">Welcome back, {user.name}</span>
              <Button className="bg-[#37322F] hover:bg-[#2A2520] text-white">
                Upgrade Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Trial Status Overview */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">Trial Ending Soon</h3>
                  <p className="text-orange-700">
                    Your Trinity Agent trial expires in {user.trialDaysLeft} days. 
                    You're seeing incredible results - don't lose this progress!
                  </p>
                </div>
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Upgrade Before Expiration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ROI Dashboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Your Trinity Agent ROI Performance
            </CardTitle>
            <CardDescription>
              Measurable results from your trial - see what you'll keep with a paid plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">${metrics.costSavings.toLocaleString()}</div>
                <div className="text-sm text-green-700">Monthly Savings Projected</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{metrics.timeReduced}h</div>
                <div className="text-sm text-blue-700">Time Saved This Week</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{metrics.accuracyImproved}%</div>
                <div className="text-sm text-purple-700">Decision Accuracy</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{metrics.efficiencyGain}%</div>
                <div className="text-sm text-orange-700">Efficiency Improvement</div>
              </div>
            </div>

            <div className="bg-[#37322F] text-white p-6 rounded-lg">
              <div className="text-center space-y-3">
                <h4 className="text-xl font-semibold">Ready to Make This Permanent?</h4>
                <p className="text-gray-200">
                  Your trial results show ${metrics.costSavings.toLocaleString()}/month savings potential. 
                  Continue this ROI with a paid Trinity Agent deployment.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="bg-white text-[#37322F] hover:bg-gray-50">
                    Compare Plans
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Upgrade to Keep Results
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trinity Agent Usage */}
        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usage">Agent Usage</TabsTrigger>
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Oracle Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-green-600" />
                    Oracle Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Queries Used:</span>
                      <span className="font-medium">{metrics.queriesUsed}/100</span>
                    </div>
                    <Progress value={(metrics.queriesUsed / 100) * 100} className="h-2" />
                    
                    <div className="text-sm text-[#605A57]">
                      <div>Insights Generated: {metrics.insights}</div>
                      <div>Accuracy Rate: {metrics.accuracyImproved}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentinel Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Sentinel Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Systems Monitored:</span>
                      <span className="font-medium">15/50</span>
                    </div>
                    <Progress value={30} className="h-2" />
                    
                    <div className="text-sm text-[#605A57]">
                      <div>Alerts Prevented: 8</div>
                      <div>Uptime: 99.8%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sage Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Sage Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Content Generated:</span>
                      <span className="font-medium">67/200</span>
                    </div>
                    <Progress value={33.5} className="h-2" />
                    
                    <div className="text-sm text-[#605A57]">
                      <div>Campaigns: 12</div>
                      <div>Engagement: +87%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    Trial Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Star className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">Revenue Prediction Master</div>
                      <div className="text-sm text-green-600">94% accuracy on business forecasts</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Star className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-800">System Optimizer</div>
                      <div className="text-sm text-blue-600">15 performance improvements implemented</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Star className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-800">Content Creation Pro</div>
                      <div className="text-sm text-purple-600">67 pieces of high-engagement content</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Incentives</CardTitle>
                  <CardDescription>Don't lose your momentum</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversionIncentives.map((incentive, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      incentive.urgency === 'high' ? 'bg-red-50 border-red-200' :
                      incentive.urgency === 'medium' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className={`font-medium mb-1 ${
                        incentive.urgency === 'high' ? 'text-red-800' :
                        incentive.urgency === 'medium' ? 'text-orange-800' :
                        'text-blue-800'
                      }`}>
                        {incentive.title}
                      </div>
                      <div className={`text-sm mb-3 ${
                        incentive.urgency === 'high' ? 'text-red-600' :
                        incentive.urgency === 'medium' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {incentive.description}
                      </div>
                      <Button size="sm" className={
                        incentive.urgency === 'high' ? 'bg-red-600 hover:bg-red-700' :
                        incentive.urgency === 'medium' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-blue-600 hover:bg-blue-700'
                      }>
                        {incentive.action}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your trial status and usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#605A57]">Plan Type:</span>
                    <Badge className="bg-green-100 text-green-700">14-Day Trial</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[#605A57]">Days Remaining:</span>
                    <span className="font-medium text-orange-600">{user.trialDaysLeft} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[#605A57]">Trial Value:</span>
                    <span className="font-medium text-green-600">${metrics.costSavings.toLocaleString()}/month</span>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full bg-[#37322F] hover:bg-[#2A2520] text-white">
                      Upgrade to Continue Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Plan</CardTitle>
                  <CardDescription>Based on your usage and results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">OracleTrinity Analytics</div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">$699/month</div>
                    <div className="text-sm text-blue-600">Perfect for your current usage patterns</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-[#605A57]">✅ Matches your analytics focus</div>
                    <div className="text-sm text-[#605A57]">✅ Covers your {metrics.queriesUsed} monthly queries</div>
                    <div className="text-sm text-[#605A57]">✅ Maintains your ${metrics.costSavings.toLocaleString()}/month ROI</div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      Choose This Plan
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Compare All Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Conversion CTA */}
        <Card className="mt-8 bg-gradient-to-r from-[#37322F] to-[#2A2520] text-white">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold">Don't Lose Your Progress</h3>
              <p className="text-gray-200 max-w-2xl mx-auto">
                Your trial shows incredible results. Companies that continue with Trinity Agents 
                see 10x ROI within the first year. Secure your competitive advantage today.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">${metrics.costSavings.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">Monthly savings at risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{metrics.efficiencyGain}%</div>
                  <div className="text-sm text-gray-300">Efficiency gains to preserve</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{user.trialDaysLeft}</div>
                  <div className="text-sm text-gray-300">Days until access expires</div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" className="bg-white text-[#37322F] hover:bg-gray-50">
                  Extend Trial (7 Days)
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Upgrade Now - Keep Your ROI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}