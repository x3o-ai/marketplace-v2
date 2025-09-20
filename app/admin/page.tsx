"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUp,
  ArrowDown,
  Brain,
  Shield,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [funnelMetrics, setFunnelMetrics] = useState({
    totalVisitors: 2847,
    ctaClicks: 423,
    signupStarted: 287,
    signupCompleted: 234,
    trialActivated: 234,
    agentInteractions: 1842,
    upgradeClicked: 67,
    subscriptionsCreated: 23,
    revenue: 87430,
    conversionRates: {
      landingToCta: 14.9,
      ctaToSignup: 67.8,
      signupCompletion: 81.5,
      trialToUpgrade: 28.6,
      upgradeToPaid: 34.3,
      overallConversion: 0.81
    }
  })

  const [realtimeData, setRealtimeData] = useState({
    activeTrialUsers: 234,
    trialExpiringSoon: 43, // Within 3 days
    revenueToday: 12450,
    newSignupsToday: 18,
    upgradesThisWeek: 8
  })

  const conversionOptimizations = [
    {
      area: 'Landing Page Hero',
      currentRate: 14.9,
      recommendation: 'A/B test "Start for free" vs "Begin 14-day trial"',
      potentialGain: '+3.2%',
      priority: 'High'
    },
    {
      area: 'Signup Form',
      currentRate: 81.5,
      recommendation: 'Reduce form fields and add social proof',
      potentialGain: '+5.8%',
      priority: 'Medium'
    },
    {
      area: 'Trial Dashboard',
      currentRate: 28.6,
      recommendation: 'Add ROI calculator and urgency messaging',
      potentialGain: '+12.4%',
      priority: 'High'
    },
    {
      area: 'Pricing Page',
      currentRate: 34.3,
      recommendation: 'Highlight savings and add testimonials',
      potentialGain: '+8.7%',
      priority: 'Medium'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Admin Header */}
      <div className="border-b border-[rgba(55,50,47,0.12)] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#37322F]">x3o.ai Admin Dashboard</h1>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                Conversion Analytics
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#605A57]">
              <span>Live Revenue: ${realtimeData.revenueToday.toLocaleString()}</span>
              <span>Active Trials: {realtimeData.activeTrialUsers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#605A57]">Landing Page Visitors</p>
                  <p className="text-2xl font-bold text-[#37322F]">{funnelMetrics.totalVisitors.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    <span>+12.3% vs last month</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#605A57]">Trial Signups</p>
                  <p className="text-2xl font-bold text-[#37322F]">{funnelMetrics.signupCompleted}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    <span>+8.7% conversion rate</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#605A57]">Paid Conversions</p>
                  <p className="text-2xl font-bold text-[#37322F]">{funnelMetrics.subscriptionsCreated}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    <span>+15.2% upgrade rate</span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#605A57]">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-[#37322F]">${funnelMetrics.revenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    <span>+23.4% growth</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="trials">Trial Management</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel Performance</CardTitle>
                <CardDescription>
                  Track user journey from landing page to Trinity Agent subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Funnel Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">{funnelMetrics.totalVisitors.toLocaleString()}</div>
                      <div className="text-sm text-blue-700">Landing Views</div>
                      <div className="text-xs text-blue-600 mt-1">100%</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-600">{funnelMetrics.ctaClicks}</div>
                      <div className="text-sm text-green-700">CTA Clicks</div>
                      <div className="text-xs text-green-600 mt-1">{funnelMetrics.conversionRates.landingToCta.toFixed(1)}%</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-lg font-bold text-purple-600">{funnelMetrics.signupCompleted}</div>
                      <div className="text-sm text-purple-700">Signups</div>
                      <div className="text-xs text-purple-600 mt-1">{funnelMetrics.conversionRates.signupCompletion.toFixed(1)}%</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-600">{funnelMetrics.upgradeClicked}</div>
                      <div className="text-sm text-orange-700">Upgrade Clicks</div>
                      <div className="text-xs text-orange-600 mt-1">{funnelMetrics.conversionRates.trialToUpgrade.toFixed(1)}%</div>
                    </div>
                    
                    <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-lg font-bold text-emerald-600">{funnelMetrics.subscriptionsCreated}</div>
                      <div className="text-sm text-emerald-700">Paid Subs</div>
                      <div className="text-xs text-emerald-600 mt-1">{funnelMetrics.conversionRates.upgradeToPaid.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#37322F] text-white rounded-lg">
                      <div className="text-sm opacity-90 mb-1">Overall Conversion Rate</div>
                      <div className="text-2xl font-bold">{funnelMetrics.conversionRates.overallConversion.toFixed(2)}%</div>
                      <div className="text-xs opacity-75">Landing page to paid customer</div>
                    </div>
                    
                    <div className="p-4 bg-green-600 text-white rounded-lg">
                      <div className="text-sm opacity-90 mb-1">Avg. Customer Value</div>
                      <div className="text-2xl font-bold">${Math.floor(funnelMetrics.revenue / funnelMetrics.subscriptionsCreated).toLocaleString()}</div>
                      <div className="text-xs opacity-75">Monthly subscription value</div>
                    </div>
                    
                    <div className="p-4 bg-blue-600 text-white rounded-lg">
                      <div className="text-sm opacity-90 mb-1">Trinity Agent Engagement</div>
                      <div className="text-2xl font-bold">{Math.floor(funnelMetrics.agentInteractions / funnelMetrics.trialActivated)}</div>
                      <div className="text-xs opacity-75">Interactions per trial user</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trials" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Active Trial Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-green-600">{realtimeData.activeTrialUsers}</div>
                    <div className="text-sm text-[#605A57]">Currently using Trinity Agents</div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">89</div>
                        <div className="text-xs text-[#605A57]">Oracle Users</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">67</div>
                        <div className="text-xs text-[#605A57]">Sentinel Users</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">78</div>
                        <div className="text-xs text-[#605A57]">Sage Users</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Conversion Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="font-medium text-orange-800">{realtimeData.trialExpiringSoon} trials expiring soon</div>
                      <div className="text-sm text-orange-600">Within 3 days - high conversion priority</div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-800">{realtimeData.upgradesThisWeek} upgrades this week</div>
                      <div className="text-sm text-green-600">Strong conversion momentum</div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">{realtimeData.newSignupsToday} new signups today</div>
                      <div className="text-sm text-blue-600">Fresh trial opportunities</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#605A57]">CreativeTrinity ($399):</span>
                      <span className="font-medium">$7,581</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605A57]">OracleTrinity ($699):</span>
                      <span className="font-medium">$34,651</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605A57]">AgentTrinity Pro ($2,499):</span>
                      <span className="font-medium">$45,198</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-semibold">
                      <span>Total Monthly:</span>
                      <span>${funnelMetrics.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-green-600">$186,750</div>
                    <div className="text-sm text-[#605A57]">Average CLV</div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg. Subscription Length:</span>
                        <span>18 months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Churn Rate:</span>
                        <span className="text-green-600">5.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Upsell Rate:</span>
                        <span className="text-blue-600">34%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                    <div className="text-sm text-[#605A57]">Projected annual ARR</div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Q1 Target:</span>
                        <span>$420K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Run Rate:</span>
                        <span className="text-green-600">$1.05M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Growth Rate:</span>
                        <span className="text-blue-600">23.4%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimizations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Optimization Opportunities</CardTitle>
                <CardDescription>
                  Data-driven recommendations to improve funnel performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionOptimizations.map((opt, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-[#37322F]">{opt.area}</div>
                        <Badge className={
                          opt.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }>
                          {opt.priority} Priority
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-[#605A57]">Current Rate:</div>
                          <div className="font-medium">{opt.currentRate}%</div>
                        </div>
                        <div>
                          <div className="text-[#605A57]">Potential Gain:</div>
                          <div className="font-medium text-green-600">{opt.potentialGain}</div>
                        </div>
                        <div>
                          <div className="text-[#605A57]">Recommendation:</div>
                          <div className="font-medium">{opt.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card className="mt-8 bg-[#37322F] text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Conversion Funnel Health: Excellent</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">81.5%</div>
                  <div className="text-sm text-gray-300">Signup completion rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">28.6%</div>
                  <div className="text-sm text-gray-300">Trial to upgrade rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">0.81%</div>
                  <div className="text-sm text-gray-300">Overall conversion rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">$186K</div>
                  <div className="text-sm text-gray-300">Customer lifetime value</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}