"use client"

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { BaseWidget, VisualizationConfig } from '@/lib/dashboard-visualization'

// Cohort Analysis Widget for Customer Retention
export class CohortAnalysisWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 500 } = this.config.chartConfig.layout
    const margin = this.config.chartConfig.layout.margin

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'cohort-analysis-widget')

    await this.drawCohortAnalysis()
  }

  private async drawCohortAnalysis(): Promise<void> {
    if (!this.svg || !this.data) return

    const { width, height, margin } = this.config.chartConfig.layout
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg.selectAll('*').remove()

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Process cohort data
    const cohorts = this.processCohortData(this.data)
    const periods = Object.keys(cohorts[0]?.periods || {})
    const cohortLabels = cohorts.map(c => c.cohort)

    // Setup scales
    const xScale = d3.scaleBand()
      .domain(periods)
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(cohortLabels)
      .range([0, innerHeight])
      .padding(0.05)

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, 1]) // Retention rates from 0% to 100%

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Periods After First Purchase')

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Cohort (First Purchase Month)')

    // Add cohort cells
    cohorts.forEach(cohort => {
      periods.forEach(period => {
        const retentionRate = cohort.periods[period] || 0
        
        g.append('rect')
          .attr('x', xScale(period))
          .attr('y', yScale(cohort.cohort))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', colorScale(retentionRate))
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            // Show retention rate tooltip
            d3.select(this).attr('stroke-width', 3)
          })
          .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 1)
          })

        // Add retention percentage text
        g.append('text')
          .attr('x', (xScale(period) || 0) + xScale.bandwidth() / 2)
          .attr('y', (yScale(cohort.cohort) || 0) + yScale.bandwidth() / 2)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '11px')
          .attr('fill', retentionRate > 0.5 ? 'white' : 'black')
          .text(`${(retentionRate * 100).toFixed(0)}%`)
      })
    })

    // Add color legend
    this.addRetentionLegend(g, colorScale, innerWidth)
  }

  private processCohortData(rawData: any[]): any[] {
    // Process raw data into cohort format
    const cohortMap = new Map()
    
    rawData.forEach(row => {
      const cohortKey = row.cohort_month
      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, { cohort: cohortKey, periods: {} })
      }
      
      const cohort = cohortMap.get(cohortKey)
      cohort.periods[`Period ${row.period}`] = row.retention_rate
    })

    return Array.from(cohortMap.values())
  }

  private addRetentionLegend(g: any, colorScale: any, width: number): void {
    const legendWidth = 200
    const legendHeight = 15
    
    const legend = g.append('g')
      .attr('transform', `translate(${width - legendWidth}, -40)`)

    // Create gradient
    const defs = this.svg!.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'cohort-gradient')

    const steps = 10
    for (let i = 0; i <= steps; i++) {
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(i / steps))
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#cohort-gradient)')

    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-size', '12px')
      .text('0%')

    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text('100%')
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawCohortAnalysis()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Geographic Map Widget for Location Analytics
export class GeographicMapWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
  private projection: d3.GeoProjection | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 500 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'geographic-map-widget')

    // Setup projection
    this.projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1000)

    await this.drawMap()
  }

  private async drawMap(): Promise<void> {
    if (!this.svg || !this.projection) return

    this.svg.selectAll('*').remove()

    // Load US states topology (you'd load this from a JSON file)
    const geoData = await this.loadGeoData()
    const path = d3.geoPath().projection(this.projection)

    // Create color scale based on data values
    const valueExtent = d3.extent(this.data, d => d.value) as [number, number]
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain(valueExtent)

    // Draw states
    this.svg.selectAll('.state')
      .data(geoData.features)
      .enter().append('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => {
        const stateData = this.data.find(item => item.state === d.properties.name)
        return stateData ? colorScale(stateData.value) : '#f0f0f0'
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const stateData = this.data.find(item => item.state === d.properties.name)
        // Show state tooltip
        console.log('State hover:', d.properties.name, stateData?.value)
      })
      .on('click', (event, d) => {
        if (this.config.interactivity.click) {
          this.handleStateClick(d.properties.name)
        }
      })

    // Add city markers if available
    if (this.data.some(d => d.lat && d.lng)) {
      this.addCityMarkers()
    }

    // Add legend
    this.addMapLegend(colorScale)
  }

  private async loadGeoData(): Promise<any> {
    // In a real implementation, you'd load this from a topology file
    // For now, return a simple mock structure
    return {
      features: [
        { properties: { name: 'California' }, geometry: {} },
        { properties: { name: 'New York' }, geometry: {} },
        { properties: { name: 'Texas' }, geometry: {} }
      ]
    }
  }

  private addCityMarkers(): void {
    if (!this.svg || !this.projection) return

    this.svg.selectAll('.city-marker')
      .data(this.data.filter(d => d.lat && d.lng))
      .enter().append('circle')
      .attr('class', 'city-marker')
      .attr('cx', d => this.projection!([d.lng, d.lat])?.[0] || 0)
      .attr('cy', d => this.projection!([d.lng, d.lat])?.[1] || 0)
      .attr('r', d => Math.sqrt(d.value) * 2)
      .attr('fill', this.config.styling.colors[1] || '#EF4444')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
  }

  private addMapLegend(colorScale: any): void {
    // Add color legend for geographic data
    const legendWidth = 200
    const legendHeight = 15
    
    const legend = this.svg!.append('g')
      .attr('transform', `translate(20, ${this.config.chartConfig.layout.height - 60})`)

    // Create gradient for legend
    const defs = this.svg!.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'map-gradient')

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
      .attr('fill', 'url(#map-gradient)')

    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-size', '12px')
      .text(colorScale.domain()[0].toLocaleString())

    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(colorScale.domain()[1].toLocaleString())
  }

  private handleStateClick(stateName: string): void {
    console.log('State clicked for drill-down:', stateName)
    // Would implement state-level drill-down
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawMap()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Network Graph Widget for Relationship Analysis
export class NetworkGraphWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
  private simulation: d3.Simulation<any, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 800, height = 600 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'network-graph-widget')

    await this.drawNetworkGraph()
  }

  private async drawNetworkGraph(): Promise<void> {
    if (!this.svg) return

    const { width, height } = this.config.chartConfig.layout
    this.svg.selectAll('*').remove()

    // Process network data
    const { nodes, links } = this.processNetworkData(this.data)

    // Setup force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create links
    const link = this.svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1))

    // Create nodes
    const node = this.svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d: any) => Math.sqrt(d.size || 100) / 2)
      .attr('fill', (d: any) => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (this.config.interactivity.click) {
          this.handleNodeClick(d)
        }
      })
      .call(this.createDragBehavior())

    // Add node labels
    const labels = this.svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d: any) => d.label || d.id)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 25)
    })
  }

  private processNetworkData(rawData: any[]): { nodes: any[], links: any[] } {
    const nodes = []
    const links = []
    const nodeMap = new Map()

    // Extract nodes and links from data
    rawData.forEach(item => {
      // Add source node
      if (!nodeMap.has(item.source)) {
        nodeMap.set(item.source, {
          id: item.source,
          label: item.sourceLabel || item.source,
          size: item.sourceSize || 100,
          type: item.sourceType || 'default'
        })
      }

      // Add target node
      if (!nodeMap.has(item.target)) {
        nodeMap.set(item.target, {
          id: item.target,
          label: item.targetLabel || item.target,
          size: item.targetSize || 100,
          type: item.targetType || 'default'
        })
      }

      // Add link
      links.push({
        source: item.source,
        target: item.target,
        value: item.value || 1,
        type: item.linkType || 'default'
      })
    })

    return {
      nodes: Array.from(nodeMap.values()),
      links
    }
  }

  private getNodeColor(node: any): string {
    const colorMap = {
      customer: '#3B82F6',
      product: '#10B981',
      campaign: '#F59E0B',
      default: '#6B7280'
    }
    
    return colorMap[node.type as keyof typeof colorMap] || colorMap.default
  }

  private createDragBehavior(): any {
    return d3.drag()
      .on('start', (event, d: any) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.3).restart()
        }
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d: any) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0)
        }
        d.fx = null
        d.fy = null
      })
  }

  private handleNodeClick(node: any): void {
    console.log('Network node clicked:', node)
    // Implement node drill-down or filtering
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawNetworkGraph()
  }

  destroy(): void {
    if (this.simulation) {
      this.simulation.stop()
    }
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Sankey Diagram Widget for Flow Analysis
export class SankeyDiagramWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 900, height = 500 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'sankey-diagram-widget')

    await this.drawSankey()
  }

  private async drawSankey(): Promise<void> {
    if (!this.svg) return

    const { width, height } = this.config.chartConfig.layout
    this.svg.selectAll('*').remove()

    // Process data for Sankey
    const { nodes, links } = this.processSankeyData(this.data)

    // Create Sankey layout
    const sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 6]])

    const sankeyData = sankey({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    })

    // Color scale for links
    const colorScale = d3.scaleOrdinal()
      .domain(nodes.map(d => d.category))
      .range(this.config.styling.colors)

    // Draw links
    this.svg.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(sankeyData.links)
      .enter().append('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', (d: any) => colorScale(d.source.category))
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.5)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8)
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.5)
      })

    // Draw nodes
    const nodeGroup = this.svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(sankeyData.nodes)
      .enter().append('g')

    nodeGroup.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => colorScale(d.category))
      .attr('stroke', 'white')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (this.config.interactivity.click) {
          this.handleNodeClick(d)
        }
      })

    // Add node labels
    nodeGroup.append('text')
      .attr('x', (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .text((d: any) => `${d.name} (${d.value.toLocaleString()})`)
  }

  private processSankeyData(rawData: any[]): { nodes: any[], links: any[] } {
    const nodeMap = new Map()
    const links = []

    // Process data to extract nodes and links
    rawData.forEach(item => {
      // Add source node
      if (!nodeMap.has(item.source)) {
        nodeMap.set(item.source, {
          id: item.source,
          name: item.sourceName || item.source,
          category: item.sourceCategory || 'default'
        })
      }

      // Add target node
      if (!nodeMap.has(item.target)) {
        nodeMap.set(item.target, {
          id: item.target,
          name: item.targetName || item.target,
          category: item.targetCategory || 'default'
        })
      }

      // Add link
      links.push({
        source: item.source,
        target: item.target,
        value: item.value
      })
    })

    return {
      nodes: Array.from(nodeMap.values()),
      links
    }
  }

  private handleNodeClick(node: any): void {
    console.log('Sankey node clicked:', node)
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawSankey()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Treemap Widget for Hierarchical Data
export class TreemapWidget extends BaseWidget {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  async render(container: HTMLElement): Promise<void> {
    const { width = 600, height = 400 } = this.config.chartConfig.layout

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'treemap-widget')

    await this.drawTreemap()
  }

  private async drawTreemap(): Promise<void> {
    if (!this.svg) return

    const { width, height } = this.config.chartConfig.layout
    this.svg.selectAll('*').remove()

    // Create hierarchical data structure
    const hierarchyData = this.createHierarchy(this.data)
    
    // Create treemap layout
    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true)

    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    treemap(root)

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(this.data.map(d => d.category))
      .range(this.config.styling.colors)

    // Draw treemap rectangles
    const leaf = this.svg.selectAll('.treemap-node')
      .data(root.leaves())
      .enter().append('g')
      .attr('class', 'treemap-node')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)

    leaf.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => colorScale(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (this.config.interactivity.click) {
          this.handleRectangleClick(d.data)
        }
      })

    // Add labels
    leaf.append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text((d: any) => d.data.name)

    leaf.append('text')
      .attr('x', 4)
      .attr('y', 28)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d: any) => d.data.value.toLocaleString())
  }

  private createHierarchy(data: any[]): any {
    // Group data by category for hierarchy
    const grouped = d3.group(data, d => d.category)
    
    const children = Array.from(grouped, ([category, items]) => ({
      name: category,
      children: items.map(item => ({
        name: item.name,
        value: item.value,
        category: item.category
      }))
    }))

    return {
      name: 'root',
      children
    }
  }

  private handleRectangleClick(data: any): void {
    console.log('Treemap rectangle clicked:', data)
    // Implement drill-down or filtering
  }

  async updateData(newData: any[]): Promise<void> {
    this.data = newData
    await this.drawTreemap()
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove()
    }
  }
}

// Export advanced widgets
export const AdvancedWidgets = {
  CohortAnalysisWidget,
  GeographicMapWidget,
  NetworkGraphWidget,
  TreemapWidget
}

export default AdvancedWidgets