"use client"

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { BaseWidget, VisualizationConfig } from '@/lib/dashboard-visualization'

// Advanced Statistical Analysis Utilities
export class StatisticalAnalysis {
  // Linear regression calculation
  static calculateLinearRegression(data: Array<{x: number, y: number}>): {
    slope: number
    intercept: number
    r2: number
    equation: string
    prediction: (x: number) => number
  } {
    const n = data.length
    const sumX = data.reduce((sum, d) => sum + d.x, 0)
    const sumY = data.reduce((sum, d) => sum + d.y, 0)
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0)
    const sumXX = data.reduce((sum, d) => sum + d.x * d.x, 0)
    const sumYY = data.reduce((sum, d) => sum + d.y * d.y, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const ssRes = data.reduce((sum, d) => {
      const predicted = slope * d.x + intercept
      return sum + Math.pow(d.y - predicted, 2)
    }, 0)
    const ssTot = data.reduce((sum, d) => sum + Math.pow(d.y - yMean, 2), 0)
    const r2 = 1 - (ssRes / ssTot)

    return {
      slope,
      intercept,
      r2,
      equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
      prediction: (x: number) => slope * x + intercept
    }
  }

  // Correlation matrix calculation
  static calculateCorrelationMatrix(data: any[], fields: string[]): number[][] {
    const matrix: number[][] = []
    
    for (let i = 0; i < fields.length; i++) {
      matrix[i] = []
      for (let j = 0; j < fields.length; j++) {
        if (i === j) {
          matrix[i][j] = 1 // Perfect correlation with self
        } else {
          matrix[i][j] = this.calculateCorrelation(data, fields[i], fields[j])
        }
      }
    }
    
    return matrix
  }

  // Pearson correlation coefficient
  private static calculateCorrelation(data: any[], field1: string, field2: string): number {
    const validData = data.filter(d => d[field1] != null && d[field2] != null)
    const n = validData.length
    
    if (n < 2) return 0

    const mean1 = validData.reduce((sum, d) => sum + d[field1], 0) / n
    const mean2 = validData.reduce((sum, d) => sum + d[field2], 0) / n

    let numerator = 0
    let sum1Sq = 0
    let sum2Sq = 0

    validData.forEach(d => {
      const diff1 = d[field1] - mean1
      const diff2 = d[field2] - mean2
      numerator += diff1 * diff2
      sum1Sq += diff1 * diff1
      sum2Sq += diff2 * diff2
    })

    const denominator = Math.sqrt(sum1Sq * sum2Sq)
    return denominator === 0 ? 0 : numerator / denominator
  }

  // Distribution analysis
  static analyzeDistribution(data: number[]): {
    mean: number
    median: number
    mode: number
    standardDeviation: number
    variance: number
    skewness: number
    kurtosis: number
    quartiles: [number, number, number]
    outliers: number[]
  } {
    const sorted = [...data].sort((a, b) => a - b)
    const n = data.length
    
    // Basic statistics
    const mean = data.reduce((sum, val) => sum + val, 0) / n
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)]

    // Mode (most frequent value)
    const frequency = new Map<number, number>()
    data.forEach(val => frequency.set(val, (frequency.get(val) || 0) + 1))
    const mode = Array.from(frequency.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0]

    // Variance and standard deviation
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    const standardDeviation = Math.sqrt(variance)

    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)]
    const q3 = sorted[Math.floor(n * 0.75)]
    const quartiles: [number, number, number] = [q1, median, q3]

    // Outliers (using IQR method)
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    const outliers = data.filter(val => val < lowerBound || val > upperBound)

    // Skewness
    const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n

    // Kurtosis
    const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3

    return {
      mean,
      median,
      mode,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      quartiles,
      outliers
    }
  }
}

// Regression Analysis Widget
export class RegressionAnalysisWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 600, height = 400 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'regression-analysis-widget')

    await this.drawRegressionAnalysis()
  }

  private async drawRegressionAnalysis(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data for regression
    const regressionData = this.data.map(d => ({
      x: d[this.config.chartConfig.dimensions[0].field],
      y: d[this.config.chartConfig.measures[0].field]
    })).filter(d => d.x != null && d.y != null)

    if (regressionData.length < 2) return

    // Calculate regression
    const regression = StatisticalAnalysis.calculateLinearRegression(regressionData)

    // Setup scales
    const xExtent = d3.extent(regressionData, d => d.x) as [number, number]
    const yExtent = d3.extent(regressionData, d => d.y) as [number, number]

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .nice()
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .nice()
      .range([innerHeight, 0])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(this.config.chartConfig.dimensions[0].field)

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(this.config.chartConfig.measures[0].field)

    // Add scatter plot points
    g.selectAll('.data-point')
      .data(regressionData)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 4)
      .attr('fill', this.config.styling.colors[0] || '#3B82F6')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1)
        // Show tooltip
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).attr('opacity', 0.7)
      })

    // Add regression line
    const regressionLine = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(regression.prediction(d.x)))

    const lineData = [
      { x: xExtent[0], y: regression.prediction(xExtent[0]) },
      { x: xExtent[1], y: regression.prediction(xExtent[1]) }
    ]

    g.append('path')
      .datum(lineData)
      .attr('d', regressionLine)
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,5')

    // Add confidence interval
    this.addConfidenceInterval(g, regressionData, regression, xScale, yScale)

    // Add regression statistics
    this.addRegressionStats(g, regression, innerWidth, innerHeight)
  }

  private addConfidenceInterval(g: any, data: any[], regression: any, xScale: any, yScale: any): void {
    // Calculate confidence interval (simplified)
    const confidence = 0.95
    const residuals = data.map(d => d.y - regression.prediction(d.x))
    const standardError = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / (data.length - 2))
    const tValue = 2.0 // Approximation for 95% confidence

    const confidenceInterval = data.map(d => {
      const predicted = regression.prediction(d.x)
      const margin = tValue * standardError
      return {
        x: d.x,
        yLower: predicted - margin,
        yUpper: predicted + margin
      }
    })

    const area = d3.area<any>()
      .x(d => xScale(d.x))
      .y0(d => yScale(d.yLower))
      .y1(d => yScale(d.yUpper))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(confidenceInterval)
      .attr('d', area)
      .attr('fill', '#EF4444')
      .attr('opacity', 0.2)
  }

  private addRegressionStats(g: any, regression: any, width: number, height: number): void {
    const statsGroup = g.append('g')
      .attr('transform', `translate(${width - 200}, 20)`)

    statsGroup.append('rect')
      .attr('width', 180)
      .attr('height', 100)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('opacity', 0.9)

    statsGroup.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Regression Analysis')

    statsGroup.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '12px')
      .text(`R² = ${regression.r2.toFixed(4)}`)

    statsGroup.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .attr('font-size', '11px')
      .text(regression.equation)

    statsGroup.append('text')
      .attr('x', 10)
      .attr('y', 75)
      .attr('font-size', '11px')
      .text(`Slope: ${regression.slope.toFixed(4)}`)

    statsGroup.append('text')
      .attr('x', 10)
      .attr('y', 90)
      .attr('font-size', '11px')
      .text(`Intercept: ${regression.intercept.toFixed(4)}`)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawRegressionAnalysis()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Correlation Matrix Widget
export class CorrelationMatrixWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 500, height = 500 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'correlation-matrix-widget')

    await this.drawCorrelationMatrix()
  }

  private async drawCorrelationMatrix(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Extract numerical fields for correlation analysis
    const numericalFields = this.config.chartConfig.measures.map(m => m.field)
    
    if (numericalFields.length < 2) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('Need at least 2 numerical fields for correlation analysis')
      return
    }

    // Calculate correlation matrix
    const correlationMatrix = StatisticalAnalysis.calculateCorrelationMatrix(this.data, numericalFields)

    // Setup scales
    const cellSize = Math.min(innerWidth, innerHeight) / numericalFields.length
    
    const xScale = d3.scaleBand()
      .domain(numericalFields)
      .range([0, cellSize * numericalFields.length])

    const yScale = d3.scaleBand()
      .domain(numericalFields)
      .range([0, cellSize * numericalFields.length])

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRdBu)
      .domain([-1, 1])

    // Add field labels
    g.append('g')
      .selectAll('.col-label')
      .data(numericalFields)
      .enter().append('text')
      .attr('class', 'col-label')
      .attr('x', d => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(d => d)

    g.append('g')
      .selectAll('.row-label')
      .data(numericalFields)
      .enter().append('text')
      .attr('class', 'row-label')
      .attr('x', -10)
      .attr('y', d => (yScale(d) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text(d => d)

    // Draw correlation cells
    numericalFields.forEach((field1, i) => {
      numericalFields.forEach((field2, j) => {
        const correlation = correlationMatrix[i][j]
        
        const cell = g.append('g')
          .attr('class', 'correlation-cell')
          .style('cursor', 'pointer')

        cell.append('rect')
          .attr('x', xScale(field1))
          .attr('y', yScale(field2))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', colorScale(correlation))
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('click', () => {
            this.handleCellClick(field1, field2, correlation)
          })

        // Add correlation value text
        cell.append('text')
          .attr('x', (xScale(field1) || 0) + xScale.bandwidth() / 2)
          .attr('y', (yScale(field2) || 0) + yScale.bandwidth() / 2)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '11px')
          .attr('fill', Math.abs(correlation) > 0.5 ? 'white' : 'black')
          .text(correlation.toFixed(2))
      })
    })

    // Add correlation legend
    this.addCorrelationLegend(g, colorScale, cellSize * numericalFields.length)
  }

  private addCorrelationLegend(g: any, colorScale: any, matrixSize: number): void {
    const legendWidth = 20
    const legendHeight = 200
    
    const legend = g.append('g')
      .attr('transform', `translate(${matrixSize + 20}, ${(matrixSize - legendHeight) / 2})`)

    // Create gradient
    const defs = this.svg!.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', legendHeight)
      .attr('x2', 0).attr('y2', 0)

    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const value = -1 + (i / steps) * 2 // -1 to 1
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(value))
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#correlation-gradient)')

    // Add legend labels
    legend.append('text')
      .attr('x', legendWidth + 5)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text('1.0')

    legend.append('text')
      .attr('x', legendWidth + 5)
      .attr('y', legendHeight / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text('0.0')

    legend.append('text')
      .attr('x', legendWidth + 5)
      .attr('y', legendHeight)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text('-1.0')
  }

  private handleCellClick(field1: string, field2: string, correlation: number): void {
    console.log(`Correlation selected: ${field1} vs ${field2} (r=${correlation.toFixed(3)})`)
    
    if (this.config.interactivity.drillDown) {
      // Create scatter plot for detailed analysis
      this.createDetailedScatterPlot(field1, field2, correlation)
    }
  }

  private createDetailedScatterPlot(field1: string, field2: string, correlation: number): void {
    // Would create a detailed scatter plot in a modal or new panel
    console.log(`Creating detailed scatter plot for ${field1} vs ${field2}`)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawCorrelationMatrix()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Distribution Plot Widget (Histogram with Statistics)
export class DistributionPlotWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 600, height = 400 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'distribution-plot-widget')

    await this.drawDistributionPlot()
  }

  private async drawDistributionPlot(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Extract values for distribution analysis
    const field = this.config.chartConfig.measures[0].field
    const values = this.data.map(d => d[field]).filter(v => v != null)
    
    if (values.length === 0) return

    // Analyze distribution
    const stats = StatisticalAnalysis.analyzeDistribution(values)

    // Create histogram
    const binCount = Math.ceil(Math.sqrt(values.length)) // Sturges' rule
    const histogram = d3.histogram()
      .domain(d3.extent(values) as [number, number])
      .thresholds(binCount)

    const bins = histogram(values)

    // Setup scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .nice()
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .nice()
      .range([innerHeight, 0])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(field)

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Frequency')

    // Draw histogram bars
    g.selectAll('.histogram-bar')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'histogram-bar')
      .attr('x', d => xScale(d.x0 || 0))
      .attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('height', d => innerHeight - yScale(d.length))
      .attr('fill', this.config.styling.colors[0] || '#3B82F6')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1)
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.7)
      })

    // Add statistical lines
    this.addStatisticalLines(g, stats, xScale, innerHeight)

    // Add statistics panel
    this.addStatisticsPanel(g, stats, innerWidth)
  }

  private addStatisticalLines(g: any, stats: any, xScale: any, height: number): void {
    // Mean line
    g.append('line')
      .attr('x1', xScale(stats.mean))
      .attr('x2', xScale(stats.mean))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3')

    g.append('text')
      .attr('x', xScale(stats.mean))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#EF4444')
      .text(`Mean: ${stats.mean.toFixed(2)}`)

    // Median line
    g.append('line')
      .attr('x1', xScale(stats.median))
      .attr('x2', xScale(stats.median))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#10B981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,2')

    g.append('text')
      .attr('x', xScale(stats.median))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#10B981')
      .text(`Median: ${stats.median.toFixed(2)}`)

    // Standard deviation bands
    g.append('rect')
      .attr('x', xScale(stats.mean - stats.standardDeviation))
      .attr('y', 0)
      .attr('width', xScale(stats.mean + stats.standardDeviation) - xScale(stats.mean - stats.standardDeviation))
      .attr('height', height)
      .attr('fill', '#F59E0B')
      .attr('opacity', 0.1)
  }

  private addStatisticsPanel(g: any, stats: any, width: number): void {
    const panel = g.append('g')
      .attr('transform', `translate(${width - 150}, 20)`)

    panel.append('rect')
      .attr('width', 140)
      .attr('height', 120)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('opacity', 0.95)

    const statsText = [
      `Mean: ${stats.mean.toFixed(2)}`,
      `Median: ${stats.median.toFixed(2)}`,
      `Std Dev: ${stats.standardDeviation.toFixed(2)}`,
      `Skewness: ${stats.skewness.toFixed(2)}`,
      `Kurtosis: ${stats.kurtosis.toFixed(2)}`,
      `Outliers: ${stats.outliers.length}`
    ]

    panel.selectAll('.stat-text')
      .data(statsText)
      .enter().append('text')
      .attr('class', 'stat-text')
      .attr('x', 10)
      .attr('y', (d, i) => 20 + i * 15)
      .attr('font-size', '11px')
      .text(d => d)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawDistributionPlot()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Box Plot Widget for Statistical Distribution
export class BoxPlotWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 400, height = 300 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'box-plot-widget')

    await this.drawBoxPlot()
  }

  private async drawBoxPlot(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Group data by category if specified
    const categoryField = this.config.chartConfig.dimensions[0]?.field
    const valueField = this.config.chartConfig.measures[0].field

    let groupedData: Map<string, number[]>
    
    if (categoryField) {
      groupedData = d3.group(this.data, d => d[categoryField])
      // Convert to array of values for each category
      for (const [key, values] of groupedData.entries()) {
        groupedData.set(key, values.map(d => d[valueField]).filter(v => v != null))
      }
    } else {
      // Single box plot
      groupedData = new Map([['All Data', this.data.map(d => d[valueField]).filter(v => v != null)]])
    }

    const categories = Array.from(groupedData.keys())
    const allValues = Array.from(groupedData.values()).flat()

    // Setup scales
    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, innerWidth])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .nice()
      .range([innerHeight, 0])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Draw box plots
    categories.forEach((category, i) => {
      const values = groupedData.get(category) || []
      if (values.length === 0) return

      const stats = StatisticalAnalysis.analyzeDistribution(values)
      const x = (xScale(category) || 0) + xScale.bandwidth() / 2
      const boxWidth = xScale.bandwidth() * 0.6

      // Draw box plot elements
      this.drawBoxPlotElements(g, x, boxWidth, stats, yScale, i)
    })
  }

  private drawBoxPlotElements(g: any, x: number, boxWidth: number, stats: any, yScale: any, colorIndex: number): void {
    const color = this.config.styling.colors[colorIndex % this.config.styling.colors.length] || '#3B82F6'

    // Main box (Q1 to Q3)
    g.append('rect')
      .attr('x', x - boxWidth / 2)
      .attr('y', yScale(stats.quartiles[2])) // Q3
      .attr('width', boxWidth)
      .attr('height', yScale(stats.quartiles[0]) - yScale(stats.quartiles[2])) // Q1 - Q3
      .attr('fill', color)
      .attr('opacity', 0.3)
      .attr('stroke', color)
      .attr('stroke-width', 1)

    // Median line
    g.append('line')
      .attr('x1', x - boxWidth / 2)
      .attr('x2', x + boxWidth / 2)
      .attr('y1', yScale(stats.median))
      .attr('y2', yScale(stats.median))
      .attr('stroke', color)
      .attr('stroke-width', 2)

    // Whiskers (using IQR method)
    const iqr = stats.quartiles[2] - stats.quartiles[0]
    const lowerWhisker = Math.max(stats.quartiles[0] - 1.5 * iqr, Math.min(...this.data.map(d => d.value)))
    const upperWhisker = Math.min(stats.quartiles[2] + 1.5 * iqr, Math.max(...this.data.map(d => d.value)))

    // Lower whisker
    g.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', yScale(stats.quartiles[0]))
      .attr('y2', yScale(lowerWhisker))
      .attr('stroke', color)
      .attr('stroke-width', 1)

    // Upper whisker
    g.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', yScale(stats.quartiles[2]))
      .attr('y2', yScale(upperWhisker))
      .attr('stroke', color)
      .attr('stroke-width', 1)

    // Whisker caps
    g.append('line')
      .attr('x1', x - boxWidth / 4)
      .attr('x2', x + boxWidth / 4)
      .attr('y1', yScale(lowerWhisker))
      .attr('y2', yScale(lowerWhisker))
      .attr('stroke', color)
      .attr('stroke-width', 1)

    g.append('line')
      .attr('x1', x - boxWidth / 4)
      .attr('x2', x + boxWidth / 4)
      .attr('y1', yScale(upperWhisker))
      .attr('y2', yScale(upperWhisker))
      .attr('stroke', color)
      .attr('stroke-width', 1)

    // Outliers
    stats.outliers.forEach((outlier: number) => {
      g.append('circle')
        .attr('cx', x)
        .attr('cy', yScale(outlier))
        .attr('r', 3)
        .attr('fill', '#EF4444')
        .attr('opacity', 0.7)
    })

    // Mean marker
    g.append('circle')
      .attr('cx', x)
      .attr('cy', yScale(stats.mean))
      .attr('r', 4)
      .attr('fill', '#F59E0B')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawDistributionPlot()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Statistical Widgets Export
export const StatisticalWidgets = {
  RegressionAnalysisWidget,
  CorrelationMatrixWidget,
  DistributionPlotWidget,
  BoxPlotWidget
}

export default StatisticalWidgets