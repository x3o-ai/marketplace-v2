"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  Target,
  Zap,
  Brain,
  Activity,
  DollarSign
} from 'lucide-react'
import { BaseWidget, VisualizationConfig } from '@/lib/dashboard-visualization'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// KPI Configuration Interfaces
export interface KPIConfig {
  metric: string
  target: number
  thresholds: KPIThreshold[]
  format: 'number' | 'currency' | 'percentage' | 'duration'
  trend: {
    enabled: boolean
    period: 'daily' | 'weekly' | 'monthly'
    showPrediction: boolean
  }
  alerts: KPIAlert[]
  conditionalFormatting: ConditionalFormat[]
  trinityAgentInsights: {
    enabled: boolean
    agent: 'oracle' | 'sentinel' | 'sage'
    analysisQuery: string
  }
}

export interface KPIThreshold {
  id: string
  name: string
  value: number
  operator: '>=' | '<=' | '=' | '!='
  color: string
  severity: 'info' | 'warning' | 'critical' | 'success'
}

export interface KPIAlert {
  id: string
  condition: string
  message: string
  channels: ('email' | 'slack' | 'in_app' | 'webhook')[]
  frequency: 'immediate' | 'daily' | 'weekly'
  enabled: boolean
}

export interface ConditionalFormat {
  condition: string
  style: {
    backgroundColor?: string
    textColor?: string
    fontSize?: string
    fontWeight?: string
    border?: string
    animation?: string
  }
}

export interface TrinityInsight {
  agent: string
  insight: string
  confidence: number
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
  generatedAt: Date
}

// Advanced KPI Widget with Trinity Agent Integration
export class AdvancedKPIWidget extends BaseWidget {
  private container: HTMLElement | null = null
  private kpiConfig: KPIConfig
  private currentValue: number = 0
  private previousValue: number = 0
  private trend: 'up' | 'down' | 'stable' = 'stable'
  private trinityInsights: TrinityInsight[] = []
  private alertsTriggered: Set<string> = new Set()

  constructor(config: VisualizationConfig, kpiConfig: KPIConfig) {
    super(config)
    this.kpiConfig = kpiConfig
  }

  async render(container: HTMLElement): Promise<void> {
    this.container = container
    await this.initializeKPIWidget()

    // Fetch Trinity Agent insights if enabled
    if (this.kpiConfig.trinityAgentInsights.enabled) {
      await this.fetchTrinityInsights()
    }

    // Setup real-time updates
    if (this.config.dataSource.refreshInterval) {
      this.setupRealTimeUpdates()
    }
  }

  private async initializeKPIWidget(): Promise<void> {
    if (!this.container || !this.data.length) return

    this.currentValue = this.data[this.data.length - 1]?.value || 0
    this.previousValue = this.data[this.data.length - 2]?.value || 0
    this.trend = this.calculateTrend()

    const formattedValue = this.formatValue(this.currentValue)
    const formattedTarget = this.formatValue(this.kpiConfig.target)
    const progress = (this.currentValue / this.kpiConfig.target) * 100
    const activeThreshold = this.getActiveThreshold()
    const conditionalStyle = this.getConditionalStyle()

    this.container.innerHTML = `
      <div class="advanced-kpi-widget" style="
        background: ${conditionalStyle.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: ${conditionalStyle.textColor || 'white'};
        padding: 24px;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        height: 100%;
        ${conditionalStyle.animation || ''}
      ">
        <!-- Alert Badge -->
        ${this.renderAlertBadge(activeThreshold)}
        
        <!-- KPI Header -->
        <div class="kpi-header" style="margin-bottom: 16px;">
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            opacity: 0.95;
            ${conditionalStyle.fontSize ? `font-size: ${conditionalStyle.fontSize};` : ''}
            ${conditionalStyle.fontWeight ? `font-weight: ${conditionalStyle.fontWeight};` : ''}
          ">${this.config.title}</h3>
        </div>

        <!-- Main KPI Value -->
        <div class="kpi-value-section" style="margin-bottom: 20px;">
          <div class="main-value" style="
            font-size: 48px;
            font-weight: bold;
            line-height: 1;
            margin-bottom: 8px;
          ">${formattedValue}</div>
          
          <div class="value-details" style="display: flex; align-items: center; gap: 12px; opacity: 0.9;">
            ${this.renderTrendIndicator()}
            <span style="font-size: 14px;">vs ${formattedTarget} target</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section" style="margin-bottom: 16px;">
          <div style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            overflow: hidden;
          ">
            <div style="
              height: 100%;
              background: ${this.getProgressColor(progress)};
              width: ${Math.min(progress, 100)}%;
              border-radius: 3px;
              transition: width 0.8s ease;
            "></div>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            font-size: 12px;
            opacity: 0.8;
          ">
            <span>0</span>
            <span>${progress.toFixed(1)}%</span>
            <span>${formattedTarget}</span>
          </div>
        </div>

        <!-- Trinity Agent Insights -->
        ${this.renderTrinityInsights()}

        <!-- Threshold Indicator -->
        ${this.renderThresholdIndicator(activeThreshold)}
      </div>
    `

    // Check and trigger alerts
    await this.checkAlerts()
  }

  private calculateTrend(): 'up' | 'down' | 'stable' {
    if (this.currentValue > this.previousValue * 1.02) return 'up'
    if (this.currentValue < this.previousValue * 0.98) return 'down'
    return 'stable'
  }

  private formatValue(value: number): string {
    switch (this.kpiConfig.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'duration':
        return `${Math.floor(value / 60)}h ${value % 60}m`
      default:
        return value.toLocaleString()
    }
  }

  private getActiveThreshold(): KPIThreshold | null {
    return this.kpiConfig.thresholds
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .find(threshold => {
        switch (threshold.operator) {
          case '>=':
            return this.currentValue >= threshold.value
          case '<=':
            return this.currentValue <= threshold.value
          case '=':
            return Math.abs(this.currentValue - threshold.value) < 0.01
          case '!=':
            return Math.abs(this.currentValue - threshold.value) >= 0.01
          default:
            return false
        }
      }) || null
  }

  private getConditionalStyle(): any {
    const matchingFormat = this.kpiConfig.conditionalFormatting.find(format => {
      try {
        // Simple condition evaluation (in production, use a safe expression evaluator)
        return eval(format.condition.replace(/value/g, this.currentValue.toString()))
      } catch {
        return false
      }
    })

    return matchingFormat?.style || {}
  }

  private renderAlertBadge(threshold: KPIThreshold | null): string {
    if (!threshold || threshold.severity === 'info') return ''

    const alertIcons = {
      warning: '⚠️',
      critical: '🚨',
      success: '✅'
    }

    const alertColors = {
      warning: '#F59E0B',
      critical: '#EF4444',
      success: '#10B981'
    }

    return `
      <div style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: ${alertColors[threshold.severity]};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        ${alertIcons[threshold.severity]} ${threshold.name}
      </div>
    `
  }

  private renderTrendIndicator(): string {
    const trendIcons = {
      up: '📈',
      down: '📉',
      stable: '➡️'
    }

    const trendColors = {
      up: '#10B981',
      down: '#EF4444',
      stable: '#6B7280'
    }

    const changePercent = this.previousValue > 0 
      ? ((this.currentValue - this.previousValue) / this.previousValue * 100).toFixed(1)
      : '0.0'

    return `
      <div style="
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: ${trendColors[this.trend]};
      ">
        ${trendIcons[this.trend]}
        <span>${this.trend === 'stable' ? '0.0' : changePercent}%</span>
      </div>
    `
  }

  private renderTrinityInsights(): string {
    if (!this.trinityInsights.length) return ''

    const topInsight = this.trinityInsights[0]
    const agentIcons = {
      oracle: '🔮',
      sentinel: '🛡️',
      sage: '⚡'
    }

    return `
      <div class="trinity-insights" style="
        background: rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        border-left: 3px solid rgba(255,255,255,0.5);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-size: 12px;
          opacity: 0.9;
        ">
          ${agentIcons[topInsight.agent]} ${topInsight.agent.toUpperCase()} Insight
          <span style="
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
          ">${topInsight.confidence}% confidence</span>
        </div>
        <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">
          ${topInsight.insight}
        </div>
        ${topInsight.actionable ? `
          <div style="
            margin-top: 6px;
            font-size: 11px;
            opacity: 0.8;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            🎯 Actionable insight available
          </div>
        ` : ''}
      </div>
    `
  }

  private renderThresholdIndicator(threshold: KPIThreshold | null): string {
    if (!threshold) return ''

    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        opacity: 0.9;
      ">
        <span>Status: ${threshold.name}</span>
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${threshold.color};
        "></div>
      </div>
    `
  }

  private getProgressColor(progress: number): string {
    if (progress >= 100) return '#10B981' // Green
    if (progress >= 80) return '#F59E0B'  // Orange
    if (progress >= 60) return '#3B82F6'  // Blue
    return '#EF4444' // Red
  }

  // Fetch insights from Trinity Agents
  private async fetchTrinityInsights(): Promise<void> {
    try {
      const response = await fetch('/api/trinity/kpi-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: this.kpiConfig.trinityAgentInsights.agent,
          query: this.kpiConfig.trinityAgentInsights.analysisQuery,
          kpiData: {
            metric: this.kpiConfig.metric,
            currentValue: this.currentValue,
            target: this.kpiConfig.target,
            trend: this.trend,
            historicalData: this.data
          }
        })
      })

      const result = await response.json()
      if (result.success && result.insights) {
        this.trinityInsights = result.insights.map((insight: any) => ({
          agent: this.kpiConfig.trinityAgentInsights.agent,
          insight: insight.message,
          confidence: insight.confidence || 85,
          actionable: insight.actionable || false,
          priority: insight.priority || 'medium',
          generatedAt: new Date()
        }))
      }
    } catch (error) {
      console.error('Failed to fetch Trinity insights:', error)
    }
  }

  // Check KPI alerts
  private async checkAlerts(): Promise<void> {
    for (const alert of this.kpiConfig.alerts) {
      if (!alert.enabled) continue

      const shouldTrigger = this.evaluateAlertCondition(alert.condition)
      const alertKey = `${alert.id}_${this.currentValue}`

      if (shouldTrigger && !this.alertsTriggered.has(alertKey)) {
        await this.triggerAlert(alert)
        this.alertsTriggered.add(alertKey)
      }
    }
  }

  private evaluateAlertCondition(condition: string): boolean {
    try {
      // Simple condition evaluation (replace with safe evaluator in production)
      const normalizedCondition = condition
        .replace(/value/g, this.currentValue.toString())
        .replace(/target/g, this.kpiConfig.target.toString())
        .replace(/previous/g, this.previousValue.toString())

      return eval(normalizedCondition)
    } catch {
      return false
    }
  }

  private async triggerAlert(alert: KPIAlert): Promise<void> {
    try {
      await fetch('/api/dashboard/kpi-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alert.id,
          kpiMetric: this.kpiConfig.metric,
          currentValue: this.currentValue,
          target: this.kpiConfig.target,
          message: alert.message,
          channels: alert.channels,
          frequency: alert.frequency,
          severity: this.getActiveThreshold()?.severity || 'info',
          timestamp: new Date().toISOString()
        })
      })

      console.log(`KPI Alert triggered: ${alert.message}`)
    } catch (error) {
      console.error('Failed to trigger KPI alert:', error)
    }
  }

  private setupRealTimeUpdates(): void {
    const interval = setInterval(async () => {
      try {
        // Fetch latest KPI value
        const response = await fetch(`/api/dashboard/kpi-data?metric=${this.kpiConfig.metric}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          this.previousValue = this.currentValue
          this.currentValue = result.data.value
          this.data = [...this.data.slice(-10), result.data] // Keep last 10 data points
          
          await this.updateVisualization()
        }
      } catch (error) {
        console.error('Failed to update KPI data:', error)
      }
    }, (this.config.dataSource.refreshInterval || 60) * 1000)

    // Store interval for cleanup
    this.config.chartConfig.customOptions = {
      ...this.config.chartConfig.customOptions,
      updateInterval: interval
    }
  }

  async updateVisualization(): Promise<void> {
    if (this.container) {
      await this.initializeKPIWidget()
    }
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.updateVisualization()
  }

  destroy(): void {
    // Clear real-time updates
    const interval = this.config.chartConfig.customOptions?.updateInterval
    if (interval) {
      clearInterval(interval)
    }

    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

// Multi-KPI Dashboard Widget
export class MultiKPIDashboardWidget extends BaseWidget {
  private container: HTMLElement | null = null
  private kpis: Array<{ config: KPIConfig; data: any[] }> = []

  async render(container: HTMLElement): Promise<void> {
    this.container = container
    await this.initializeMultiKPIDashboard()
  }

  private async initializeMultiKPIDashboard(): Promise<void> {
    if (!this.container) return

    // Process multiple KPIs from data
    this.kpis = this.processMultiKPIData(this.data)

    this.container.innerHTML = `
      <div class="multi-kpi-dashboard" style="
        background: white;
        border-radius: 12px;
        padding: 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
      ">
        <div class="dashboard-header" style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #374151;">
            ${this.config.title}
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${this.config.description || 'Key performance indicators overview'}
          </p>
        </div>

        <div class="kpi-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          flex: 1;
        ">
          ${this.kpis.map((kpi, index) => this.renderKPICard(kpi, index)).join('')}
        </div>

        <div class="dashboard-footer" style="
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: between;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
        ">
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></div>
            <span>Live data</span>
          </div>
        </div>
      </div>
    `
  }

  private processMultiKPIData(data: any[]): Array<{ config: KPIConfig; data: any[] }> {
    // Extract KPI configurations from data or config
    const kpiConfigs = this.config.chartConfig.customOptions?.kpis || []
    
    return kpiConfigs.map((kpiConfig: KPIConfig) => ({
      config: kpiConfig,
      data: data.filter(d => d.metric === kpiConfig.metric)
    }))
  }

  private renderKPICard(kpi: { config: KPIConfig; data: any[] }, index: number): string {
    const latestValue = kpi.data[kpi.data.length - 1]?.value || 0
    const previousValue = kpi.data[kpi.data.length - 2]?.value || 0
    const progress = (latestValue / kpi.config.target) * 100
    const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable'

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    const color = colors[index % colors.length]

    return `
      <div class="kpi-card" style="
        background: linear-gradient(135deg, ${color}15, ${color}05);
        border: 1px solid ${color}30;
        border-radius: 8px;
        padding: 16px;
        position: relative;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        ">
          <h4 style="
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
          ">${kpi.config.metric}</h4>
          ${trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
        </div>

        <div style="margin-bottom: 8px;">
          <div style="
            font-size: 28px;
            font-weight: bold;
            color: ${color};
            line-height: 1;
          ">${this.formatKPIValue(latestValue, kpi.config.format)}</div>
          <div style="
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          ">Target: ${this.formatKPIValue(kpi.config.target, kpi.config.format)}</div>
        </div>

        <div style="
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        ">
          <div style="
            height: 100%;
            background: ${color};
            width: ${Math.min(progress, 100)}%;
            border-radius: 2px;
            transition: width 0.5s ease;
          "></div>
        </div>

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #6b7280;
        ">
          <span>${progress.toFixed(1)}% of target</span>
          <span>${trend === 'up' ? '+' : trend === 'down' ? '-' : ''}${Math.abs(((latestValue - previousValue) / (previousValue || 1)) * 100).toFixed(1)}%</span>
        </div>
      </div>
    `
  }

  private formatKPIValue(value: number, format: string): string {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          notation: value >= 1000000 ? 'compact' : 'standard'
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'duration':
        return `${Math.floor(value / 60)}h ${value % 60}m`
      default:
        return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toLocaleString()
    }
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.updateVisualization()
  }

  async updateVisualization(): Promise<void> {
    await this.initializeMultiKPIDashboard()
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

// Trinity Agent Powered Insight Widget
export class TrinityInsightWidget extends BaseWidget {
  private container: HTMLElement | null = null
  private insights: TrinityInsight[] = []

  async render(container: HTMLElement): Promise<void> {
    this.container = container
    await this.fetchAndRenderInsights()
  }

  private async fetchAndRenderInsights(): Promise<void> {
    if (!this.container) return

    // Fetch insights from all Trinity Agents
    const agents: ('oracle' | 'sentinel' | 'sage')[] = ['oracle', 'sentinel', 'sage']
    const allInsights: TrinityInsight[] = []

    for (const agent of agents) {
      try {
        const response = await fetch('/api/trinity/dashboard-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent,
            context: {
              dashboardData: this.data,
              timeRange: '30d',
              metrics: this.config.chartConfig.measures.map(m => m.field)
            }
          })
        })

        const result = await response.json()
        if (result.success && result.insights) {
          allInsights.push(...result.insights.map((insight: any) => ({
            agent,
            insight: insight.description,
            confidence: insight.confidence,
            actionable: insight.actionable,
            priority: insight.priority,
            generatedAt: new Date()
          })))
        }
      } catch (error) {
        console.error(`Failed to fetch ${agent} insights:`, error)
      }
    }

    this.insights = allInsights
      .sort((a, b) => {
        // Sort by priority and confidence
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityWeight[a.priority]
        const bPriority = priorityWeight[b.priority]
        
        if (aPriority !== bPriority) return bPriority - aPriority
        return b.confidence - a.confidence
      })
      .slice(0, 5) // Top 5 insights

    await this.renderInsights()
  }

  private async renderInsights(): Promise<void> {
    if (!this.container) return

    const agentColors = {
      oracle: '#10B981',
      sentinel: '#3B82F6', 
      sage: '#8B5CF6'
    }

    const agentIcons = {
      oracle: '🔮',
      sentinel: '🛡️',
      sage: '⚡'
    }

    this.container.innerHTML = `
      <div class="trinity-insight-widget" style="
        background: white;
        border-radius: 12px;
        padding: 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
      ">
        <div class="insight-header" style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #374151;">
            🤖 Trinity Agent Insights
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            AI-powered analysis of your business metrics
          </p>
        </div>

        <div class="insights-list" style="flex: 1; space-y: 12px;">
          ${this.insights.map((insight, index) => `
            <div class="insight-card" style="
              background: ${agentColors[insight.agent]}08;
              border: 1px solid ${agentColors[insight.agent]}20;
              border-left: 4px solid ${agentColors[insight.agent]};
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 12px;
              animation: slideInFade 0.5s ease-out ${index * 0.1}s both;
            ">
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  font-weight: 500;
                  color: ${agentColors[insight.agent]};
                ">
                  ${agentIcons[insight.agent]} ${insight.agent.toUpperCase()}
                  <span style="
                    background: ${agentColors[insight.agent]}15;
                    color: ${agentColors[insight.agent]};
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                  ">${insight.confidence}%</span>
                </div>
                
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  ${insight.priority === 'high' ? '🔥' : insight.priority === 'medium' ? '⚡' : '💡'}
                  ${insight.actionable ? '🎯' : ''}
                </div>
              </div>

              <div style="
                font-size: 14px;
                line-height: 1.5;
                color: #374151;
              ">${insight.insight}</div>

              ${insight.actionable ? `
                <div style="
                  margin-top: 12px;
                  padding-top: 12px;
                  border-top: 1px solid ${agentColors[insight.agent]}20;
                ">
                  <button style="
                    background: ${agentColors[insight.agent]};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                  ">Take Action</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="insight-footer" style="
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        ">
          <div>Powered by Trinity Agents • Updated ${new Date().toLocaleTimeString()}</div>
        </div>

        <style>
          @keyframes slideInFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        </style>
      </div>
    `
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.fetchAndRenderInsights()
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

// Custom KPI Widgets Export
export const KPIWidgets = {
  AdvancedKPIWidget,
  MultiKPIDashboardWidget,
  TrinityInsightWidget
}

export default KPIWidgets