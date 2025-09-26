"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { BaseWidget, VisualizationConfig, VisualizationType } from '@/lib/dashboard-visualization'

// Advanced Chart Library Components
export interface ChartProps {
  config: VisualizationConfig
  data: any[]
  width?: number
  height?: number
  onInteraction?: (event: string, data: any) => void
}

// Line Chart with Advanced Features
export class AdvancedLineChart extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 400 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'advanced-line-chart')

    // Create tooltip
    this.tooltip = d3.select(container)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')

    await this.drawChart()
  }

  private async drawChart(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Clear previous content
    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Setup scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(this.data, d => new Date(d.date)) as [Date, Date])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.value) as [number, number])
      .nice()
      .range([innerHeight, 0])

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(this.config.chartConfig.axes?.x.title || 'Date')

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(this.config.chartConfig.axes?.y.title || 'Value')

    // Add grid lines
    if (this.config.chartConfig.axes?.x.grid) {
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat('' as any))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
    }

    if (this.config.chartConfig.axes?.y.grid) {
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('' as any))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
    }

    // Add line
    const path = g.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', this.config.styling.colors[0] || '#3B82F6')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Add interactive dots
    if (this.config.interactivity.hover) {
      g.selectAll('.dot')
        .data(this.data)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(new Date(d.date)))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', this.config.styling.colors[0] || '#3B82F6')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          if (this.tooltip) {
            this.tooltip.transition().duration(200).style('opacity', 0.9)
            this.tooltip.html(`Date: ${d.date}<br/>Value: ${d.value.toLocaleString()}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px')
          }
        })
        .on('mouseout', () => {
          if (this.tooltip) {
            this.tooltip.transition().duration(500).style('opacity', 0)
          }
        })
        .on('click', (event, d) => {
          if (this.config.interactivity.click) {
            this.handleChartClick(d)
          }
        })
    }

    // Add trend line if enabled
    if (this.config.chartConfig.customOptions?.showTrend) {
      this.addTrendLine(g, xScale, yScale)
    }

    // Add annotations
    if (this.config.chartConfig.annotations) {
      this.addAnnotations(g, xScale, yScale)
    }
  }

  private addTrendLine(g: any, xScale: any, yScale: any): void {
    // Calculate linear regression
    const regression = this.calculateLinearRegression(this.data)
    
    const trendLine = d3.line<any>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(regression.slope * d.x + regression.intercept))

    g.append('path')
      .datum(this.data.map((d, i) => ({ ...d, x: i })))
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('d', trendLine)
  }

  private calculateLinearRegression(data: any[]): { slope: number; intercept: number } {
    const n = data.length
    const sumX = data.reduce((sum, _, i) => sum + i, 0)
    const sumY = data.reduce((sum, d) => sum + d.value, 0)
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0)
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private addAnnotations(g: any, xScale: any, yScale: any): void {
    this.config.chartConfig.annotations?.forEach(annotation => {
      switch (annotation.type) {
        case 'line':
          g.append('line')
            .attr('x1', 0)
            .attr('x2', xScale.range()[1])
            .attr('y1', yScale(annotation.value))
            .attr('y2', yScale(annotation.value))
            .attr('stroke', annotation.style.color || '#666')
            .attr('stroke-width', annotation.style.width || 1)
            .attr('stroke-dasharray', annotation.style.dash || 'none')
          break
        
        case 'text':
          g.append('text')
            .attr('x', xScale.range()[1] - 10)
            .attr('y', yScale(annotation.value) - 5)
            .attr('text-anchor', 'end')
            .attr('font-size', annotation.style.fontSize || '12px')
            .attr('fill', annotation.style.color || '#666')
            .text(annotation.text || '')
          break
      }
    })
  }

  private handleChartClick(data: any): void {
    // Emit click event for cross-chart interactions
    if (this.config.interactivity.crossFilter) {
      this.emitFilterEvent(data)
    }

    // Handle drill-down
    if (this.config.interactivity.drillDown) {
      this.handleDrillDown(data)
    }
  }

  private emitFilterEvent(data: any): void {
    // Would emit events to linked charts
    console.log('Cross-filter event:', data)
  }

  private handleDrillDown(data: any): void {
    // Would navigate to detailed view
    console.log('Drill-down event:', data)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    if (this.element) {
      await this.drawChart()
    }
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
    if (this.tooltip) {
      this.tooltip.remove()
    }
  }
}

// Advanced Bar Chart with Grouping and Stacking
export class AdvancedBarChart extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 400 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'advanced-bar-chart')

    await this.drawChart()
  }

  private async drawChart(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Determine chart type (grouped or stacked)
    const isStacked = this.config.chartConfig.customOptions?.stacked || false
    const categories = [...new Set(this.data.map(d => d.category))]
    const series = [...new Set(this.data.map(d => d.series))]

    // Setup scales
    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.value) || 0])
      .nice()
      .range([innerHeight, 0])

    const colorScale = d3.scaleOrdinal()
      .domain(series)
      .range(this.config.styling.colors)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale))

    if (isStacked) {
      this.renderStackedBars(g, xScale, yScale, colorScale)
    } else {
      this.renderGroupedBars(g, xScale, yScale, colorScale)
    }
  }

  private renderStackedBars(g: any, xScale: any, yScale: any, colorScale: any): void {
    // Stack the data
    const stackGenerator = d3.stack<any, string>()
      .keys([...new Set(this.data.map(d => d.series))])
      .value((d, key) => {
        const item = d.values.find((v: any) => v.series === key)
        return item ? item.value : 0
      })

    const groupedData = d3.group(this.data, d => d.category)
    const stackData = Array.from(groupedData, ([key, values]) => ({ category: key, values }))
    const series = stackGenerator(stackData)

    g.selectAll('.series')
      .data(series)
      .enter().append('g')
      .attr('class', 'series')
      .attr('fill', (d: any) => colorScale(d.key))
      .selectAll('rect')
      .data((d: any) => d)
      .enter().append('rect')
      .attr('x', (d: any) => xScale(d.data.category))
      .attr('y', (d: any) => yScale(d[1]))
      .attr('height', (d: any) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
  }

  private renderGroupedBars(g: any, xScale: any, yScale: any, colorScale: any): void {
    const series = [...new Set(this.data.map(d => d.series))]
    const xSubScale = d3.scaleBand()
      .domain(series)
      .range([0, xScale.bandwidth()])
      .padding(0.05)

    g.selectAll('.bar-group')
      .data(d3.group(this.data, d => d.category))
      .enter().append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d: any) => `translate(${xScale(d[0])},0)`)
      .selectAll('rect')
      .data((d: any) => d[1])
      .enter().append('rect')
      .attr('x', (d: any) => xSubScale(d.series))
      .attr('y', (d: any) => yScale(d.value))
      .attr('width', xSubScale.bandwidth())
      .attr('height', (d: any) => innerHeight - yScale(d.value))
      .attr('fill', (d: any) => colorScale(d.series))
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawChart()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
    if (this.tooltip) {
      this.tooltip.remove()
    }
  }
}

// Advanced Pie Chart with Drill-down
export class AdvancedPieChart extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 400, height = 400 } = this.config.chartConfig.layout
    const radius = Math.min(width, height) / 2 - 40

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'advanced-pie-chart')

    const g = this.svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc<any>()
      .innerRadius(this.config.chartConfig.customOptions?.donut ? radius * 0.4 : 0)
      .outerRadius(radius)

    const colorScale = d3.scaleOrdinal()
      .domain(this.data.map(d => d.label))
      .range(this.config.styling.colors)

    const arcs = g.selectAll('.arc')
      .data(pie(this.data))
      .enter().append('g')
      .attr('class', 'arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => colorScale(d.data.label))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (this.config.interactivity.click) {
          this.handleSliceClick(d.data)
        }
      })

    // Add labels
    arcs.append('text')
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text((d: any) => d.data.label)

    // Add center label for donut charts
    if (this.config.chartConfig.customOptions?.donut) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('dy', '0.35em')
        .text(this.config.chartConfig.customOptions?.centerLabel || '')
    }
  }

  private handleSliceClick(data: any): void {
    if (this.config.interactivity.drillDown) {
      // Implement drill-down to detailed view
      console.log('Pie slice drill-down:', data)
    }
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    if (this.element) {
      await this.render(this.element)
    }
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Advanced Heatmap with Clustering
export class AdvancedHeatmap extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 600 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'advanced-heatmap')

    await this.drawHeatmap()
  }

  private async drawHeatmap(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get unique values for axes
    const xLabels = [...new Set(this.data.map(d => d.x))]
    const yLabels = [...new Set(this.data.map(d => d.y))]

    // Setup scales
    const xScale = d3.scaleBand()
      .domain(xLabels)
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(yLabels)
      .range([0, innerHeight])
      .padding(0.05)

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain(d3.extent(this.data, d => d.value) as [number, number])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Add heatmap cells
    g.selectAll('.cell')
      .data(this.data)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.x) || 0)
      .attr('y', d => yScale(d.y) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', 'black').attr('stroke-width', 2)
        // Show tooltip with value
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', 'none')
      })

    // Add color legend
    this.addColorLegend(g, colorScale, innerWidth)
  }

  private addColorLegend(g: any, colorScale: any, width: number): void {
    const legendWidth = 300
    const legendHeight = 20
    
    const legend = g.append('g')
      .attr('transform', `translate(${(width - legendWidth) / 2}, -30)`)

    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth])

    const legendAxis = d3.axisTop(legendScale)
      .ticks(5)

    legend.append('g')
      .call(legendAxis)

    // Create gradient for legend
    const defs = this.svg!.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')

    const steps = 10
    for (let i = 0; i <= steps; i++) {
      const value = colorScale.domain()[0] + (i / steps) * (colorScale.domain()[1] - colorScale.domain()[0])
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(value))
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#legend-gradient)')
      .attr('y', -legendHeight)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawHeatmap()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Funnel Chart for Conversion Analysis
export class FunnelChart extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 600, height = 400 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'funnel-chart')

    await this.drawFunnel()
  }

  private async drawFunnel(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height } = this.config.chartConfig.layout
    const maxValue = Math.max(...this.data.map(d => d.value))
    
    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${width / 2}, 20)`)

    // Calculate funnel segment dimensions
    const segmentHeight = (height - 40) / this.data.length
    const maxWidth = width * 0.8

    this.data.forEach((d, i) => {
      const segmentWidth = (d.value / maxValue) * maxWidth
      const y = i * segmentHeight

      // Draw funnel segment
      const segment = g.append('g')
        .attr('class', 'funnel-segment')

      segment.append('rect')
        .attr('x', -segmentWidth / 2)
        .attr('y', y)
        .attr('width', segmentWidth)
        .attr('height', segmentHeight - 5)
        .attr('fill', this.config.styling.colors[i % this.config.styling.colors.length])
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (this.config.interactivity.click) {
            this.handleSegmentClick(d)
          }
        })

      // Add labels
      segment.append('text')
        .attr('x', 0)
        .attr('y', y + segmentHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(`${d.label}: ${d.value.toLocaleString()}`)

      // Add conversion rate
      if (i > 0) {
        const conversionRate = ((d.value / this.data[i - 1].value) * 100).toFixed(1)
        segment.append('text')
          .attr('x', segmentWidth / 2 + 10)
          .attr('y', y + segmentHeight / 2)
          .attr('text-anchor', 'start')
          .attr('dy', '0.35em')
          .attr('fill', '#666')
          .attr('font-size', '12px')
          .text(`${conversionRate}%`)
      }
    })
  }

  private handleSegmentClick(data: any): void {
    console.log('Funnel segment clicked:', data)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawFunnel()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Gauge Chart for KPI Monitoring
export class GaugeChart extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 300, height = 200 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'gauge-chart')

    await this.drawGauge()
  }

  private async drawGauge(): Promise<void> {
    if (!this.svg || !this.data || this.data.length === 0) return

    const { width, height } = this.config.chartConfig.layout
    const radius = Math.min(width, height * 2) / 2 - 20
    const value = this.data[0].value
    const min = this.config.chartConfig.customOptions?.min || 0
    const max = this.config.chartConfig.customOptions?.max || 100

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height - 20})`)

    // Create gauge background arc
    const backgroundArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)

    g.append('path')
      .attr('d', backgroundArc)
      .attr('fill', '#e5e7eb')

    // Create value arc
    const angle = ((value - min) / (max - min)) * Math.PI - Math.PI / 2
    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(angle)

    g.append('path')
      .attr('d', valueArc)
      .attr('fill', this.getGaugeColor(value, min, max))

    // Add needle
    const needleLength = radius - 30
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', needleLength * Math.cos(angle))
      .attr('y2', needleLength * Math.sin(angle))
      .attr('stroke', '#374151')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')

    // Add center circle
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', '#374151')

    // Add value text
    g.append('text')
      .attr('x', 0)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text(value.toLocaleString())

    // Add min/max labels
    g.append('text')
      .attr('x', -radius + 10)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(min.toString())

    g.append('text')
      .attr('x', radius - 10)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(max.toString())
  }

  private getGaugeColor(value: number, min: number, max: number): string {
    const percentage = (value - min) / (max - min)
    
    if (percentage < 0.3) return '#EF4444' // Red
    if (percentage < 0.7) return '#F59E0B' // Orange
    return '#10B981' // Green
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawGauge()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Export all chart components
export const ChartLibrary = {
  AdvancedLineChart,
  AdvancedBarChart,
  AdvancedPieChart,
  FunnelChart,
  GaugeChart
}

export default ChartLibrary