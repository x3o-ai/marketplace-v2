"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { BaseWidget, VisualizationConfig } from '@/lib/dashboard-visualization'

// Real-time Data Streaming Interface
export interface RealTimeDataStream {
  id: string
  source: 'analytics' | 'trinity_agent' | 'external_api' | 'websocket'
  endpoint: string
  updateFrequency: number // milliseconds
  bufferSize: number
  dataTransform?: (data: any) => any
  isActive: boolean
}

export interface StreamingDataPoint {
  timestamp: number
  value: any
  metadata?: any
}

// Real-time Chart Base Class
export abstract class RealTimeWidget extends BaseWidget {
  protected stream: RealTimeDataStream | null = null
  protected dataBuffer: StreamingDataPoint[] = []
  protected streamingInterval: NodeJS.Timeout | null = null
  protected isStreaming = false

  // Initialize real-time streaming
  async initializeStreaming(streamConfig: RealTimeDataStream): Promise<void> {
    this.stream = streamConfig
    
    if (streamConfig.isActive) {
      await this.startStreaming()
    }
  }

  // Start data streaming
  async startStreaming(): Promise<void> {
    if (this.isStreaming || !this.stream) return

    this.isStreaming = true
    console.log(`Starting real-time stream: ${this.stream.id}`)

    // Start polling for new data
    this.streamingInterval = setInterval(async () => {
      try {
        await this.fetchStreamingData()
      } catch (error) {
        console.error('Streaming data fetch error:', error)
      }
    }, this.stream.updateFrequency)

    // Initial data fetch
    await this.fetchStreamingData()
  }

  // Stop data streaming
  stopStreaming(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
      this.streamingInterval = null
    }
    this.isStreaming = false
    console.log('Stopped real-time streaming')
  }

  // Fetch new streaming data
  private async fetchStreamingData(): Promise<void> {
    if (!this.stream) return

    try {
      let newData: any

      switch (this.stream.source) {
        case 'analytics':
          newData = await this.fetchAnalyticsUpdate()
          break
        case 'trinity_agent':
          newData = await this.fetchTrinityAgentUpdate()
          break
        case 'external_api':
          newData = await this.fetchExternalAPIUpdate()
          break
        case 'websocket':
          // WebSocket updates would be handled differently
          return
      }

      if (newData) {
        const transformedData = this.stream.dataTransform ? this.stream.dataTransform(newData) : newData
        this.addToBuffer(transformedData)
        await this.updateVisualization()
      }
    } catch (error) {
      console.error('Failed to fetch streaming data:', error)
    }
  }

  private async fetchAnalyticsUpdate(): Promise<any> {
    const response = await fetch(`/api/analytics/real-time?source=${this.stream!.endpoint}`)
    const result = await response.json()
    return result.data
  }

  private async fetchTrinityAgentUpdate(): Promise<any> {
    const response = await fetch(`/api/trinity/real-time-insights?agent=${this.stream!.endpoint}`)
    const result = await response.json()
    return result.insights
  }

  private async fetchExternalAPIUpdate(): Promise<any> {
    const response = await fetch(this.stream!.endpoint)
    return await response.json()
  }

  // Add data to buffer with size management
  private addToBuffer(data: any): void {
    if (!this.stream) return

    const dataPoint: StreamingDataPoint = {
      timestamp: Date.now(),
      value: data,
      metadata: { source: this.stream.source }
    }

    this.dataBuffer.push(dataPoint)

    // Maintain buffer size
    if (this.dataBuffer.length > this.stream.bufferSize) {
      this.dataBuffer.shift() // Remove oldest data point
    }

    // Update main data array for widget
    this.data = this.dataBuffer.map(point => ({
      ...point.value,
      timestamp: point.timestamp
    }))
  }

  // Abstract method for updating visualization
  abstract updateVisualization(): Promise<void>

  destroy(): void {
    this.stopStreaming()
    super.destroy()
  }
}

// Real-time Line Chart for Live Metrics
export class RealTimeLineChart extends RealTimeWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
  private xScale: d3.ScaleTime<number, number> | null = null
  private yScale: d3.ScaleLinear<number, number> | null = null
  private line: d3.Line<any> | null = null
  private path: d3.Selection<SVGPathElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 300 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'real-time-line-chart')

    await this.initializeChart()
    
    // Initialize streaming if configured
    if (this.config.dataSource.refreshInterval) {
      await this.initializeStreaming({
        id: `realtime_${Date.now()}`,
        source: this.config.dataSource.source as any,
        endpoint: this.config.dataSource.connection,
        updateFrequency: this.config.dataSource.refreshInterval * 1000,
        bufferSize: 100,
        isActive: true
      })
    }
  }

  private async initializeChart(): Promise<void> {
    if (!this.svg) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Setup scales
    this.xScale = d3.scaleTime()
      .range([0, innerWidth])

    this.yScale = d3.scaleLinear()
      .range([innerHeight, 0])

    // Create line generator
    this.line = d3.line<any>()
      .x(d => this.xScale!(new Date(d.timestamp)))
      .y(d => this.yScale!(d.value))
      .curve(d3.curveMonotoneX)

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)

    g.append('g')
      .attr('class', 'y-axis')

    // Add line path
    this.path = g.append('path')
      .attr('class', 'data-line')
      .attr('fill', 'none')
      .attr('stroke', this.config.styling.colors[0] || '#3B82F6')
      .attr('stroke-width', 2)

    // Add real-time indicator
    g.append('circle')
      .attr('class', 'live-indicator')
      .attr('r', 4)
      .attr('fill', '#EF4444')
      .attr('cx', innerWidth - 10)
      .attr('cy', 10)

    g.append('text')
      .attr('x', innerWidth - 20)
      .attr('y', 10)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('fill', '#EF4444')
      .text('LIVE')

    await this.updateVisualization()
  }

  async updateVisualization(): Promise<void> {
    if (!this.svg || !this.xScale || !this.yScale || !this.line || !this.path) return

    if (this.data.length === 0) return

    // Update scale domains
    const timeExtent = d3.extent(this.data, d => new Date(d.timestamp)) as [Date, Date]
    const valueExtent = d3.extent(this.data, d => d.value) as [number, number]

    this.xScale.domain(timeExtent)
    this.yScale.domain(valueExtent).nice()

    // Update axes
    this.svg.select('.x-axis')
      .transition()
      .duration(500)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%H:%M:%S')))

    this.svg.select('.y-axis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(this.yScale))

    // Update line path with smooth transition
    this.path
      .datum(this.data)
      .transition()
      .duration(500)
      .attr('d', this.line)

    // Animate live indicator
    this.svg.select('.live-indicator')
      .transition()
      .duration(300)
      .attr('r', 6)
      .transition()
      .duration(300)
      .attr('r', 4)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.updateVisualization()
  }

  destroy(): void {
    this.stopStreaming()
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Real-time KPI Widget with Live Updates
export class RealTimeKPIWidget extends RealTimeWidget {
  private container: HTMLElement | null = null
  private currentValue: number = 0
  private targetValue: number = 0

  async render(container: HTMLElement): Promise<void> {
    this.container = container
    await this.initializeKPIWidget()

    // Initialize streaming
    if (this.config.dataSource.refreshInterval) {
      await this.initializeStreaming({
        id: `kpi_realtime_${Date.now()}`,
        source: this.config.dataSource.source as any,
        endpoint: this.config.dataSource.connection,
        updateFrequency: this.config.dataSource.refreshInterval * 1000,
        bufferSize: 10, // KPI only needs recent values
        isActive: true
      })
    }
  }

  private async initializeKPIWidget(): Promise<void> {
    if (!this.container) return

    this.container.innerHTML = `
      <div class="real-time-kpi-widget" style="
        background: linear-gradient(135deg, ${this.config.styling.colors[0] || '#3B82F6'}, ${this.config.styling.colors[1] || '#1E40AF'});
        padding: 24px;
        border-radius: 12px;
        color: white;
        text-align: center;
        position: relative;
        overflow: hidden;
      ">
        <div class="live-indicator" style="
          position: absolute;
          top: 12px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: #EF4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        
        <h3 style="margin: 0 0 8px 0; font-size: 16px; opacity: 0.9;">${this.config.title}</h3>
        
        <div class="kpi-value" style="
          font-size: 48px;
          font-weight: bold;
          line-height: 1;
          margin: 16px 0;
        ">${this.currentValue.toLocaleString()}</div>
        
        <div class="kpi-details" style="font-size: 14px; opacity: 0.8;">
          <div class="target">Target: ${this.targetValue.toLocaleString()}</div>
          <div class="progress-bar" style="
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            margin: 8px 0;
            overflow: hidden;
          ">
            <div class="progress-fill" style="
              height: 100%;
              background: white;
              border-radius: 2px;
              width: ${this.calculateProgress()}%;
              transition: width 0.5s ease;
            "></div>
          </div>
          <div class="change">Last updated: <span class="timestamp">--:--:--</span></div>
        </div>

        <style>
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        </style>
      </div>
    `

    await this.updateVisualization()
  }

  async updateVisualization(): Promise<void> {
    if (!this.container || this.data.length === 0) return

    const latestData = this.data[this.data.length - 1]
    this.currentValue = latestData.value || 0
    this.targetValue = latestData.target || this.config.chartConfig.customOptions?.target || 100

    // Update value with animation
    const valueElement = this.container.querySelector('.kpi-value')
    if (valueElement) {
      // Animate number change
      this.animateNumberChange(valueElement as HTMLElement, this.currentValue)
    }

    // Update progress bar
    const progressFill = this.container.querySelector('.progress-fill') as HTMLElement
    if (progressFill) {
      progressFill.style.width = `${this.calculateProgress()}%`
    }

    // Update timestamp
    const timestampElement = this.container.querySelector('.timestamp')
    if (timestampElement) {
      timestampElement.textContent = new Date().toLocaleTimeString()
    }

    // Check for alerts
    await this.checkKPIAlerts()
  }

  private animateNumberChange(element: HTMLElement, newValue: number): void {
    const startValue = parseInt(element.textContent?.replace(/,/g, '') || '0')
    const duration = 1000 // 1 second animation
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (newValue - startValue) * easeOut
      
      element.textContent = Math.round(currentValue).toLocaleString()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  private calculateProgress(): number {
    if (this.targetValue === 0) return 0
    return Math.min((this.currentValue / this.targetValue) * 100, 100)
  }

  private async checkKPIAlerts(): Promise<void> {
    const progress = this.calculateProgress()
    const alertThreshold = this.config.chartConfig.customOptions?.alertThreshold || 90

    if (progress >= alertThreshold) {
      // Trigger success alert
      await this.triggerAlert('success', `KPI target achieved: ${this.currentValue.toLocaleString()}`)
    } else if (progress < 50) {
      // Trigger warning alert
      await this.triggerAlert('warning', `KPI below 50% of target: ${this.currentValue.toLocaleString()}`)
    }
  }

  private async triggerAlert(type: 'success' | 'warning' | 'error', message: string): Promise<void> {
    // Integration with notification system
    console.log(`KPI Alert [${type}]: ${message}`)
    
    // Could integrate with email, Slack, or in-app notifications
    try {
      await fetch('/api/dashboard/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          widgetId: this.config.title,
          value: this.currentValue,
          target: this.targetValue,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.updateVisualization()
  }

  destroy(): void {
    this.stopStreaming()
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

// Real-time Activity Feed Widget
export class RealTimeActivityFeed extends RealTimeWidget {
  private container: HTMLElement | null = null
  private activityList: HTMLElement | null = null

  async render(container: HTMLElement): Promise<void> {
    this.container = container
    await this.initializeActivityFeed()

    // Initialize streaming for activity updates
    await this.initializeStreaming({
      id: `activity_feed_${Date.now()}`,
      source: 'trinity_agent',
      endpoint: 'activity_stream',
      updateFrequency: 5000, // 5 seconds
      bufferSize: 50,
      isActive: true
    })
  }

  private async initializeActivityFeed(): Promise<void> {
    if (!this.container) return

    this.container.innerHTML = `
      <div class="real-time-activity-feed" style="
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        height: 400px;
        display: flex;
        flex-direction: column;
      ">
        <div class="feed-header" style="
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px 8px 0 0;
        ">
          <h3 style="margin: 0; font-size: 16px; color: #374151;">
            Live Activity Feed
            <span class="live-badge" style="
              display: inline-block;
              margin-left: 8px;
              padding: 2px 6px;
              background: #EF4444;
              color: white;
              font-size: 10px;
              border-radius: 4px;
              font-weight: normal;
            ">LIVE</span>
          </h3>
        </div>
        
        <div class="activity-list" style="
          flex: 1;
          overflow-y: auto;
          padding: 0;
        "></div>
      </div>
    `

    this.activityList = this.container.querySelector('.activity-list')
    await this.updateVisualization()
  }

  async updateVisualization(): Promise<void> {
    if (!this.activityList || this.data.length === 0) return

    // Clear existing activities
    this.activityList.innerHTML = ''

    // Add recent activities
    this.data.slice(-20).reverse().forEach((activity, index) => {
      const activityElement = this.createActivityElement(activity, index)
      this.activityList!.appendChild(activityElement)
    })
  }

  private createActivityElement(activity: any, index: number): HTMLElement {
    const element = document.createElement('div')
    element.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      animation: slideIn 0.3s ease-out;
      animation-delay: ${index * 0.05}s;
      opacity: 0;
      animation-fill-mode: forwards;
    `

    const timeAgo = this.formatTimeAgo(activity.timestamp)
    const icon = this.getActivityIcon(activity.type)
    const color = this.getActivityColor(activity.type)

    element.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color}15;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          ${icon}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; color: #374151; font-size: 14px; margin-bottom: 4px;">
            ${activity.title || 'Activity Update'}
          </div>
          <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">
            ${activity.description || 'No description available'}
          </div>
          <div style="color: #9ca3af; font-size: 12px;">
            ${timeAgo}
          </div>
        </div>
      </div>

      <style>
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `

    return element
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  private getActivityIcon(type: string): string {
    const icons = {
      user_signup: '👤',
      trial_start: '🎯',
      agent_interaction: '🤖',
      subscription: '💳',
      alert: '⚠️',
      success: '✅',
      default: '📊'
    }
    
    return icons[type as keyof typeof icons] || icons.default
  }

  private getActivityColor(type: string): string {
    const colors = {
      user_signup: '#3B82F6',
      trial_start: '#10B981',
      agent_interaction: '#8B5CF6',
      subscription: '#F59E0B',
      alert: '#EF4444',
      success: '#10B981',
      default: '#6B7280'
    }
    
    return colors[type as keyof typeof colors] || colors.default
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.updateVisualization()
  }

  destroy(): void {
    this.stopStreaming()
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

// Real-time Notification System
export class RealTimeNotificationManager {
  private widgets: Map<string, RealTimeWidget> = new Map()
  private notificationQueue: any[] = []

  // Register widget for real-time updates
  registerWidget(widgetId: string, widget: RealTimeWidget): void {
    this.widgets.set(widgetId, widget)
  }

  // Unregister widget
  unregisterWidget(widgetId: string): void {
    const widget = this.widgets.get(widgetId)
    if (widget) {
      widget.stopStreaming()
      this.widgets.delete(widgetId)
    }
  }

  // Broadcast data update to all widgets
  async broadcastUpdate(data: any, targetWidgets?: string[]): Promise<void> {
    const widgets = targetWidgets 
      ? targetWidgets.map(id => this.widgets.get(id)).filter(Boolean)
      : Array.from(this.widgets.values())

    for (const widget of widgets) {
      try {
        await widget!.updateData([data])
      } catch (error) {
        console.error('Failed to update widget:', error)
      }
    }
  }

  // Get streaming statistics
  getStreamingStats(): {
    activeWidgets: number
    totalDataPoints: number
    averageUpdateFrequency: number
  } {
    let totalDataPoints = 0
    let totalFrequency = 0

    for (const widget of this.widgets.values()) {
      totalDataPoints += widget['dataBuffer']?.length || 0
      totalFrequency += widget['stream']?.updateFrequency || 0
    }

    return {
      activeWidgets: this.widgets.size,
      totalDataPoints,
      averageUpdateFrequency: this.widgets.size > 0 ? totalFrequency / this.widgets.size : 0
    }
  }
}

// WebSocket integration for real-time updates
export class DashboardWebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private notificationManager: RealTimeNotificationManager

  constructor(notificationManager: RealTimeNotificationManager) {
    this.notificationManager = notificationManager
  }

  connect(url: string): void {
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('Dashboard WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Dashboard WebSocket disconnected')
        this.attemptReconnect(url)
      }

      this.ws.onerror = (error) => {
        console.error('Dashboard WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'kpi_update':
        this.notificationManager.broadcastUpdate(data.payload, [data.widgetId])
        break
      
      case 'analytics_update':
        this.notificationManager.broadcastUpdate(data.payload)
        break
      
      case 'alert':
        this.handleAlert(data.payload)
        break
      
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  private handleAlert(alert: any): void {
    // Handle real-time alerts
    console.log('Real-time alert:', alert)
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect(url)
      }, Math.pow(2, this.reconnectAttempts) * 1000) // Exponential backoff
    } else {
      console.error('Max WebSocket reconnection attempts reached')
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

// Export real-time components
export const RealTimeComponents = {
  RealTimeLineChart,
  RealTimeKPIWidget,
  RealTimeActivityFeed,
  RealTimeNotificationManager,
  DashboardWebSocketManager
}

export default RealTimeComponents