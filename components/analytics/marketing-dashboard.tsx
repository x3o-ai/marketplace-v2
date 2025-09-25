"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  DollarSign, 
  MousePointer, 
  Eye,
  Target,
  Zap,
  RefreshCw,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MarketingDashboardProps {
  organizationId: string
  userId: string
  timeRange?: string
}

interface DashboardData {
  metrics: {
    sessions: number
    users: number
    conversions: number
    revenue: number
    conversionRate: number
    bounceRate: number
  }
  insights: Array<{
    type: string
    insight: string
    priority: string
    actionable: boolean
  }>
  trafficSources: Array<{
    source: string
    sessions: number
    conversions: number
    conversionRate: number
  }>
  topPages: Array<{
    page: string
    pageviews: number
    exits: number
  }>
  trends: {
    sessionsChange: number
    conversionsChange: number
    revenueChange: number
  }
  lastUpdated: string
}

export function MarketingDashboard({ organizationId, userId, timeRange = '30d' }: MarketingDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/dashboard?organizationId=${organizationId}&timeRange=${selectedTimeRange}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || 'Failed to load analytics data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [organizationId, selectedTimeRange])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadDashboardData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleTimeRangeChange = (newRange: string) => {
    setSelectedTimeRange(newRange)
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#37322F]"></div>
        <span className="ml-2 text-[#605A57]">Loading analytics data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Analytics Connection Error</h3>
          <p className="text-[#605A57] mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#37322F]">Marketing Analytics Dashboard</h2>
          <p className="text-[#605A57]">Real-time insights from connected analytics platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-[#605A57]">
              {autoRefresh ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={data?.metrics.sessions.toLocaleString() || '0'}
          change={data?.trends.sessionsChange}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Unique Users"
          value={data?.metrics.users.toLocaleString() || '0'}
          change={data?.trends.conversionsChange}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Conversions"
          value={data?.metrics.conversions.toLocaleString() || '0'}
          change={data?.trends.conversionsChange}
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Revenue"
          value={`$${data?.metrics.revenue.toLocaleString() || '0'}`}
          change={data?.trends.revenueChange}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Conversion Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#605A57]">Conversion Rate</span>
                <span className="font-semibold">{data?.metrics.conversionRate.toFixed(2)}%</span>
              </div>
              <Progress value={data?.metrics.conversionRate || 0} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#605A57]">Bounce Rate</span>
                <span className="font-semibold">{data?.metrics.bounceRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={data?.metrics.bounceRate || 0} 
                className="h-2" 
                // Invert colors - lower bounce rate is better
              />
            </div>
            
            <div className="pt-3 border-t">
              <h4 className="font-medium mb-2">Performance vs Industry</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Your conversion rate</span>
                  <Badge variant={data?.metrics.conversionRate > 2 ? "default" : "secondary"}>
                    {data?.metrics.conversionRate > 2 ? 'Above Average' : 'Below Average'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Industry benchmark</span>
                  <span className="text-[#605A57]">2.3%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-green-600" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.trafficSources.slice(0, 5).map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#37322F]">{source.source}</div>
                    <div className="text-xs text-[#605A57]">
                      {source.sessions.toLocaleString()} sessions • {source.conversions} conversions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{source.conversionRate.toFixed(1)}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(source.conversionRate * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI-Powered Marketing Insights
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              Real Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.insights.slice(0, 6).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  insight.priority === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : insight.priority === 'medium'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#37322F] mb-1">
                      {insight.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-[#605A57]">{insight.insight}</div>
                  </div>
                  {insight.actionable && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Actionable
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Pages Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Top Performing Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.topPages.slice(0, 8).map((page, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#37322F] truncate max-w-md">
                    {page.page}
                  </div>
                  <div className="text-xs text-[#605A57]">
                    {page.pageviews.toLocaleString()} pageviews
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{page.pageviews.toLocaleString()}</div>
                  <div className="text-xs text-[#605A57]">{page.exits} exits</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-[#605A57] pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live data from Google Analytics & Mixpanel</span>
          </div>
          <span>Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Never'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  )
}

// Metric card component
function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}: {
  title: string
  value: string
  change?: number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#605A57]">{title}</p>
            <p className="text-2xl font-bold text-[#37322F]">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs previous period
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketingDashboard