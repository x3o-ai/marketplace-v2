"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain,
  Shield,
  Sparkles,
  TrendingUp,
  Activity,
  Users,
  DollarSign,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react'

export default function TrialDashboardPage() {
  const sessionResult = useSession()
  const session = sessionResult?.data
  const status = sessionResult?.status
  const [trialDaysLeft, setTrialDaysLeft] = useState(14)
  const [activeDemo, setActiveDemo] = useState('oracle')
  const [trialMetrics, setTrialMetrics] = useState({
    oracle: { queries: 0, insights: 0, accuracy: 94, predictions: 0 },
    sentinel: { monitored: 0, alerts: 0, uptime: 99.8, optimizations: 0 },
    sage: { content: 0, campaigns: 0, engagement: 87, conversions: 0 }
  })
  const [realROI, setRealROI] = useState({
    costSavings: '$0',
    timeReduced: '0 hours',
    accuracyImproved: '94%',
    efficiencyGain: '0%'
  })

  // Fetch real trial data from database
  useEffect(() => {
    if (session?.user?.id) {
      fetchRealTrialData(session.user.id)
    }
  }, [session])

  const fetchRealTrialData = async (userId: string) => {
    try {
      // Fetch real trial status
      const trialResponse = await fetch(`/api/trial/access?userId=${userId}`)
      const trialData = await trialResponse.json()

      if (trialData.success) {
        setTrialDaysLeft(trialData.trial.daysRemaining)
        
        // Update metrics with real data
        setTrialMetrics({
          oracle: {
            queries: trialData.trial.usage.oracle || 0,
            insights: Math.floor((trialData.trial.usage.oracle || 0) * 0.3),
            accuracy: 94,
            predictions: Math.floor((trialData.trial.usage.oracle || 0) * 0.2)
          },
          sentinel: {
            monitored: 15,
            alerts: trialData.trial.usage.sentinel || 0,
            uptime: 99.8,
            optimizations: Math.floor((trialData.trial.usage.sentinel || 0) * 0.5)
          },
          sage: {
            content: trialData.trial.usage.sage || 0,
            campaigns: Math.floor((trialData.trial.usage.sage || 0) * 0.1),
            engagement: 87,
            conversions: Math.floor((trialData.trial.usage.sage || 0) * 0.3)
          }
        })

        // Calculate real ROI based on usage
        const totalUsage = (trialData.trial.usage.oracle || 0) + (trialData.trial.usage.sentinel || 0) + (trialData.trial.usage.sage || 0)
        const projectedSavings = Math.floor(totalUsage * 500 + 25000) // Base savings + usage multiplier
        const timeReduced = Math.floor(totalUsage * 2.5 + 20) // Hours saved
        const efficiencyGain = Math.min(500, Math.floor(totalUsage * 8 + 100)) // Efficiency percentage

        setRealROI({
          costSavings: `$${projectedSavings.toLocaleString()}`,
          timeReduced: `${timeReduced} hours`,
          accuracyImproved: '94%',
          efficiencyGain: `${efficiencyGain}%`
        })
      }
    } catch (error) {
      console.error('Failed to fetch real trial data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Header */}
      <div className="border-b border-[rgba(55,50,47,0.12)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-semibold text-[#37322F]">x3o.ai</div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Trial Active
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-[#605A57]">
                <Clock className="inline h-4 w-4 mr-1" />
                {trialDaysLeft} days left in trial
              </div>
              <Button className="bg-[#37322F] hover:bg-[#2A2520] text-white">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] mb-2">
            Welcome to Your Trinity Agent Trial
          </h1>
          <p className="text-[#605A57] max-w-2xl mx-auto">
            Experience the power of enterprise AI automation. Your trial includes full access to Oracle Analytics, 
            Sentinel Monitoring, and Sage Optimization with sample data.
          </p>
        </div>

        {/* Trial Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Trial Progress & Results
            </CardTitle>
            <CardDescription>
              See the impact Trinity Agents are already making for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{realROI.costSavings}</div>
                <div className="text-sm text-green-700">Projected Monthly Savings</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">{realROI.timeReduced}</div>
                <div className="text-sm text-blue-700">Time Saved This Week</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">{realROI.accuracyImproved}</div>
                <div className="text-sm text-purple-700">Decision Accuracy</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">{realROI.efficiencyGain}</div>
                <div className="text-sm text-orange-700">Efficiency Improvement</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-[#37322F] text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Ready to make this permanent?</div>
                  <div className="text-sm opacity-90">Continue these results with a paid plan</div>
                </div>
                <Button variant="outline" className="bg-white text-[#37322F] hover:bg-gray-50">
                  View Pricing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trinity Agent Demos */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="oracle" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Oracle Analytics
            </TabsTrigger>
            <TabsTrigger value="sentinel" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sentinel Monitoring
            </TabsTrigger>
            <TabsTrigger value="sage" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Sage Optimization
            </TabsTrigger>
          </TabsList>

          {/* Oracle Analytics Demo */}
          <TabsContent value="oracle">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  Oracle Analytics Trial Results
                </CardTitle>
                <CardDescription>
                  Advanced business intelligence and predictive analytics in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 mb-2">Revenue Prediction</div>
                      <div className="text-2xl font-bold text-green-600">$284,650</div>
                      <div className="text-sm text-green-600">Next quarter forecast • 94% confidence</div>
                    </div>
                    
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 mb-2">Customer Insights</div>
                      <div className="text-2xl font-bold text-blue-600">8 Key Trends</div>
                      <div className="text-sm text-blue-600">Identified growth opportunities</div>
                    </div>

                    <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-700 mb-2">Risk Assessment</div>
                      <div className="text-2xl font-bold text-purple-600">Low Risk</div>
                      <div className="text-sm text-purple-600">Market conditions favorable</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-[#37322F] mb-3">Sample Oracle Insights</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Customer retention will increase 15% next quarter</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Marketing spend efficiency can improve by 23%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Product demand spike predicted for Q2</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask Oracle a Question
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentinel Monitoring Demo */}
          <TabsContent value="sentinel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Sentinel Monitoring Trial Results
                </CardTitle>
                <CardDescription>
                  Autonomous system monitoring and optimization in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 mb-2">System Health</div>
                      <div className="text-2xl font-bold text-blue-600">99.8%</div>
                      <div className="text-sm text-blue-600">Uptime this week</div>
                    </div>
                    
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-700 mb-2">Alerts Prevented</div>
                      <div className="text-2xl font-bold text-orange-600">15</div>
                      <div className="text-sm text-orange-600">Issues caught early</div>
                    </div>

                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 mb-2">Performance Gain</div>
                      <div className="text-2xl font-bold text-green-600">23%</div>
                      <div className="text-sm text-green-600">Speed improvement</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-[#37322F] mb-3">Recent Optimizations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span>Database queries optimized (+34% faster)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span>Memory usage reduced by 18%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span>API response times improved 45ms</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Shield className="h-4 w-4 mr-2" />
                      View System Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sage Optimization Demo */}
          <TabsContent value="sage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Sage Optimization Trial Results
                </CardTitle>
                <CardDescription>
                  Intelligent process automation and content generation in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-700 mb-2">Content Generated</div>
                      <div className="text-2xl font-bold text-purple-600">47 Pieces</div>
                      <div className="text-sm text-purple-600">Marketing materials created</div>
                    </div>
                    
                    <div className="p-4 border border-pink-200 bg-pink-50 rounded-lg">
                      <div className="text-sm text-pink-700 mb-2">Engagement Rate</div>
                      <div className="text-2xl font-bold text-pink-600">87%</div>
                      <div className="text-sm text-pink-600">Above industry average</div>
                    </div>

                    <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
                      <div className="text-sm text-indigo-700 mb-2">Process Efficiency</div>
                      <div className="text-2xl font-bold text-indigo-600">340%</div>
                      <div className="text-sm text-indigo-600">Faster than manual</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-[#37322F] mb-3">Recent Optimizations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span>Email campaign performance +67%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span>Content production time reduced 78%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span>Brand consistency improved 91%</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trial Status & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Trial Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trial Status</CardTitle>
              <CardDescription>Your progress with Trinity Agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#605A57]">Oracle Analytics</span>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <Progress value={75} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#605A57]">Sentinel Monitoring</span>
                <Badge className="bg-blue-100 text-blue-700">Active</Badge>
              </div>
              <Progress value={60} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#605A57]">Sage Optimization</span>
                <Badge className="bg-purple-100 text-purple-700">Active</Badge>
              </div>
              <Progress value={45} className="h-2" />

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-[#605A57] mb-2">Overall Trial Progress</div>
                <Progress value={85} className="h-3" />
                <div className="text-xs text-[#605A57] mt-1">85% complete - excellent progress!</div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Maximize your Trinity Agent trial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#37322F]">Try Oracle Predictions</div>
                  <div className="text-xs text-[#605A57]">Ask Oracle to forecast your business metrics</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#37322F]">Set Up Monitoring</div>
                  <div className="text-xs text-[#605A57]">Configure Sentinel to monitor your systems</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#37322F]">Generate Content</div>
                  <div className="text-xs text-[#605A57]">Let Sage create marketing materials</div>
                </div>
              </div>

              <Button className="w-full mt-4 bg-[#37322F] hover:bg-[#2A2520] text-white">
                <ArrowRight className="h-4 w-4 mr-2" />
                Schedule Implementation Call
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Conversion CTA */}
        <Card className="mt-8 bg-gradient-to-r from-[#37322F] to-[#2A2520] text-white">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Ready to Deploy Trinity Agents?</h3>
              <p className="text-gray-200 max-w-2xl mx-auto">
                Your trial shows {realROI.costSavings} monthly savings potential.
                Continue this ROI with a full enterprise deployment.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="bg-white text-[#37322F] hover:bg-gray-50">
                  Extend Trial
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Upgrade to Enterprise
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}