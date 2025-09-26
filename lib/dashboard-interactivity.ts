// Advanced Dashboard Interactivity System
// Enterprise-grade interactive features for sophisticated business intelligence

export interface InteractionEvent {
  type: InteractionType
  source: string // widget ID
  target?: string // target widget ID for cross-chart interactions
  data: any
  timestamp: number
  userId: string
}

export enum InteractionType {
  DRILL_DOWN = 'drill_down',
  DRILL_UP = 'drill_up',
  FILTER_APPLY = 'filter_apply',
  FILTER_CLEAR = 'filter_clear',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  ZOOM_RESET = 'zoom_reset',
  CROSS_FILTER = 'cross_filter',
  BRUSH_SELECT = 'brush_select',
  HOVER = 'hover',
  CLICK = 'click',
  DOUBLE_CLICK = 'double_click'
}

export interface DrillDownConfig {
  enabled: boolean
  levels: DrillDownLevel[]
  defaultLevel: number
  maxLevels: number
  breadcrumbEnabled: boolean
}

export interface DrillDownLevel {
  id: string
  name: string
  dimension: string
  dataSource?: string
  query?: string
  aggregation?: string
}

export interface FilterConfig {
  enabled: boolean
  fields: FilterField[]
  globalFilters: boolean
  temporalFilters: boolean
  customFilters: boolean
}

export interface FilterField {
  field: string
  type: 'categorical' | 'numerical' | 'temporal' | 'text'
  operators: FilterOperator[]
  values?: any[]
  defaultValue?: any
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export interface ZoomConfig {
  enabled: boolean
  type: 'semantic' | 'geometric'
  constraints: {
    minZoom: number
    maxZoom: number
    panEnabled: boolean
  }
  resetEnabled: boolean
}

export interface CrossChartConfig {
  enabled: boolean
  linkedCharts: string[]
  filterPropagation: boolean
  highlightPropagation: boolean
  selectionPropagation: boolean
}

// Interactive Features Manager
export class DashboardInteractivityManager {
  private widgets: Map<string, any> = new Map()
  private globalFilters: Map<string, any> = new Map()
  private interactionHistory: InteractionEvent[] = []
  private crossChartConnections: Map<string, string[]> = new Map()

  // Register widget for interactive features
  registerWidget(widgetId: string, widget: any, interactivityConfig: any): void {
    this.widgets.set(widgetId, {
      widget,
      config: interactivityConfig,
      currentLevel: 0,
      appliedFilters: new Map(),
      zoomState: { level: 1, panX: 0, panY: 0 }
    })

    // Setup cross-chart connections
    if (interactivityConfig.crossChart?.enabled) {
      this.crossChartConnections.set(widgetId, interactivityConfig.crossChart.linkedCharts || [])
    }
  }

  // Handle drill-down interaction
  async handleDrillDown(widgetId: string, drillData: any): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo || !widgetInfo.config.drillDown?.enabled) return

    const currentLevel = widgetInfo.currentLevel
    const drillConfig = widgetInfo.config.drillDown
    
    if (currentLevel >= drillConfig.maxLevels - 1) {
      console.warn('Maximum drill-down level reached')
      return
    }

    // Get next drill level configuration
    const nextLevel = drillConfig.levels[currentLevel + 1]
    if (!nextLevel) return

    try {
      // Fetch drill-down data
      const drillDownData = await this.fetchDrillDownData(nextLevel, drillData)
      
      // Update widget data
      await widgetInfo.widget.updateData(drillDownData)
      
      // Update drill level
      widgetInfo.currentLevel = currentLevel + 1
      
      // Update breadcrumb if enabled
      if (drillConfig.breadcrumbEnabled) {
        this.updateBreadcrumb(widgetId, nextLevel.name, drillData)
      }

      // Log interaction
      this.logInteraction({
        type: InteractionType.DRILL_DOWN,
        source: widgetId,
        data: { level: nextLevel.id, drillData },
        timestamp: Date.now(),
        userId: this.getCurrentUserId()
      })

    } catch (error) {
      console.error('Drill-down failed:', error)
    }
  }

  // Handle drill-up interaction
  async handleDrillUp(widgetId: string): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo || widgetInfo.currentLevel === 0) return

    const drillConfig = widgetInfo.config.drillDown
    const previousLevel = drillConfig.levels[widgetInfo.currentLevel - 1]

    try {
      // Fetch previous level data
      const drillUpData = await this.fetchDrillDownData(previousLevel, {})
      
      // Update widget data
      await widgetInfo.widget.updateData(drillUpData)
      
      // Update drill level
      widgetInfo.currentLevel = widgetInfo.currentLevel - 1
      
      // Update breadcrumb
      if (drillConfig.breadcrumbEnabled) {
        this.updateBreadcrumb(widgetId, previousLevel.name, {})
      }

      this.logInteraction({
        type: InteractionType.DRILL_UP,
        source: widgetId,
        data: { level: previousLevel.id },
        timestamp: Date.now(),
        userId: this.getCurrentUserId()
      })

    } catch (error) {
      console.error('Drill-up failed:', error)
    }
  }

  // Handle filter application
  async applyFilter(
    widgetId: string, 
    field: string, 
    operator: FilterOperator, 
    value: any,
    isGlobal = false
  ): Promise<void> {
    const filter = { field, operator, value }

    if (isGlobal) {
      // Apply to all connected widgets
      this.globalFilters.set(field, filter)
      
      for (const [id, widgetInfo] of this.widgets.entries()) {
        if (widgetInfo.config.filter?.globalFilters) {
          await this.applyFilterToWidget(id, filter)
        }
      }
    } else {
      // Apply to specific widget
      await this.applyFilterToWidget(widgetId, filter)
    }

    // Handle cross-chart filtering
    if (isGlobal || this.shouldPropagateCrossFilter(widgetId)) {
      await this.propagateCrossChartFilter(widgetId, filter)
    }

    this.logInteraction({
      type: InteractionType.FILTER_APPLY,
      source: widgetId,
      data: { filter, isGlobal },
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    })
  }

  // Apply filter to specific widget
  private async applyFilterToWidget(widgetId: string, filter: any): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Store applied filter
    widgetInfo.appliedFilters.set(filter.field, filter)

    // Filter widget data
    const filteredData = this.filterData(widgetInfo.widget.data, [filter])
    
    // Update widget with filtered data
    await widgetInfo.widget.updateData(filteredData)
  }

  // Filter data based on applied filters
  private filterData(data: any[], filters: any[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const fieldValue = item[filter.field]
        
        switch (filter.operator) {
          case FilterOperator.EQUALS:
            return fieldValue === filter.value
          case FilterOperator.NOT_EQUALS:
            return fieldValue !== filter.value
          case FilterOperator.GREATER_THAN:
            return fieldValue > filter.value
          case FilterOperator.LESS_THAN:
            return fieldValue < filter.value
          case FilterOperator.BETWEEN:
            return fieldValue >= filter.value[0] && fieldValue <= filter.value[1]
          case FilterOperator.IN:
            return filter.value.includes(fieldValue)
          case FilterOperator.NOT_IN:
            return !filter.value.includes(fieldValue)
          case FilterOperator.CONTAINS:
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
          case FilterOperator.STARTS_WITH:
            return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase())
          case FilterOperator.IS_NULL:
            return fieldValue == null
          case FilterOperator.IS_NOT_NULL:
            return fieldValue != null
          default:
            return true
        }
      })
    })
  }

  // Handle zoom interactions
  async handleZoom(
    widgetId: string, 
    zoomType: 'in' | 'out' | 'reset',
    zoomCenter?: { x: number; y: number }
  ): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo || !widgetInfo.config.zoom?.enabled) return

    const zoomConfig = widgetInfo.config.zoom
    const currentState = widgetInfo.zoomState

    switch (zoomType) {
      case 'in':
        if (currentState.level < zoomConfig.constraints.maxZoom) {
          currentState.level *= 1.5
          if (zoomCenter) {
            currentState.panX += (zoomCenter.x - currentState.panX) * 0.5
            currentState.panY += (zoomCenter.y - currentState.panY) * 0.5
          }
        }
        break
      
      case 'out':
        if (currentState.level > zoomConfig.constraints.minZoom) {
          currentState.level /= 1.5
          currentState.panX *= 0.8
          currentState.panY *= 0.8
        }
        break
      
      case 'reset':
        currentState.level = 1
        currentState.panX = 0
        currentState.panY = 0
        break
    }

    // Apply zoom transformation to widget
    await this.applyZoomTransformation(widgetId, currentState)

    this.logInteraction({
      type: zoomType === 'in' ? InteractionType.ZOOM_IN : 
            zoomType === 'out' ? InteractionType.ZOOM_OUT : InteractionType.ZOOM_RESET,
      source: widgetId,
      data: { zoomLevel: currentState.level, center: zoomCenter },
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    })
  }

  // Apply zoom transformation
  private async applyZoomTransformation(widgetId: string, zoomState: any): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Apply zoom to widget's SVG or canvas element
    const svg = widgetInfo.widget.element?.querySelector('svg')
    if (svg) {
      const g = d3.select(svg).select('g')
      g.transition()
        .duration(300)
        .attr('transform', `translate(${zoomState.panX}, ${zoomState.panY}) scale(${zoomState.level})`)
    }
  }

  // Handle cross-chart interactions
  private async propagateCrossChartFilter(sourceWidgetId: string, filter: any): Promise<void> {
    const linkedCharts = this.crossChartConnections.get(sourceWidgetId) || []
    
    for (const targetWidgetId of linkedCharts) {
      const targetWidget = this.widgets.get(targetWidgetId)
      if (targetWidget && targetWidget.config.crossChart?.filterPropagation) {
        await this.applyFilterToWidget(targetWidgetId, filter)
      }
    }
  }

  // Handle selection propagation
  async propagateSelection(sourceWidgetId: string, selectedData: any[]): Promise<void> {
    const linkedCharts = this.crossChartConnections.get(sourceWidgetId) || []
    
    for (const targetWidgetId of linkedCharts) {
      const targetWidget = this.widgets.get(targetWidgetId)
      if (targetWidget && targetWidget.config.crossChart?.selectionPropagation) {
        await this.highlightDataInWidget(targetWidgetId, selectedData)
      }
    }
  }

  // Highlight data in target widget
  private async highlightDataInWidget(widgetId: string, dataToHighlight: any[]): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Find corresponding data points in target widget
    const matchingData = widgetInfo.widget.data.filter((item: any) =>
      dataToHighlight.some(highlight => this.dataPointsMatch(item, highlight))
    )

    // Apply highlighting (implementation depends on chart type)
    await this.applyDataHighlighting(widgetId, matchingData)
  }

  // Check if data points match for cross-chart highlighting
  private dataPointsMatch(item1: any, item2: any): boolean {
    // Implement matching logic based on common fields
    const commonFields = ['id', 'category', 'date', 'user_id']
    
    return commonFields.some(field => 
      item1[field] && item2[field] && item1[field] === item2[field]
    )
  }

  // Apply visual highlighting to data points
  private async applyDataHighlighting(widgetId: string, dataToHighlight: any[]): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Get widget's SVG element
    const svg = widgetInfo.widget.element?.querySelector('svg')
    if (!svg) return

    // Clear previous highlights
    d3.select(svg).selectAll('.highlighted').classed('highlighted', false)

    // Apply new highlights
    dataToHighlight.forEach(data => {
      // Find corresponding visual elements (bars, circles, etc.)
      d3.select(svg).selectAll(`[data-id="${data.id}"]`)
        .classed('highlighted', true)
        .attr('stroke', '#FF6B6B')
        .attr('stroke-width', 3)
    })
  }

  // Brush selection handling
  async handleBrushSelection(widgetId: string, brushArea: any): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo || !widgetInfo.config.brush?.enabled) return

    // Find data points within brush selection
    const selectedData = this.getDataInBrushArea(widgetInfo.widget.data, brushArea)

    // Apply selection to current widget
    await this.applySelection(widgetId, selectedData)

    // Propagate to linked charts
    if (widgetInfo.config.crossChart?.selectionPropagation) {
      await this.propagateSelection(widgetId, selectedData)
    }

    this.logInteraction({
      type: InteractionType.BRUSH_SELECT,
      source: widgetId,
      data: { brushArea, selectedCount: selectedData.length },
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    })
  }

  // Get data points within brush area
  private getDataInBrushArea(data: any[], brushArea: any): any[] {
    const { x0, y0, x1, y1 } = brushArea
    
    return data.filter(d => {
      // Assuming x and y are normalized coordinates (0-1)
      const x = d.normalizedX || 0
      const y = d.normalizedY || 0
      
      return x >= x0 && x <= x1 && y >= y0 && y <= y1
    })
  }

  // Apply selection highlighting
  private async applySelection(widgetId: string, selectedData: any[]): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Store selection state
    widgetInfo.selectedData = selectedData

    // Apply visual selection styling
    await this.applySelectionStyling(widgetId, selectedData)
  }

  // Apply visual selection styling
  private async applySelectionStyling(widgetId: string, selectedData: any[]): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    const svg = widgetInfo.widget.element?.querySelector('svg')
    if (!svg) return

    // Remove previous selection
    d3.select(svg).selectAll('.selected').classed('selected', false)

    // Apply selection to data points
    selectedData.forEach(data => {
      d3.select(svg).selectAll(`[data-id="${data.id}"]`)
        .classed('selected', true)
        .attr('opacity', 1)
    })

    // Dim non-selected elements
    d3.select(svg).selectAll(':not(.selected)')
      .attr('opacity', 0.3)
  }

  // Advanced filtering system
  async createAdvancedFilter(
    widgetId: string,
    filterConfig: FilterField,
    value: any
  ): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    // Create filter based on field type
    let filter: any

    switch (filterConfig.type) {
      case 'categorical':
        filter = this.createCategoricalFilter(filterConfig, value)
        break
      case 'numerical':
        filter = this.createNumericalFilter(filterConfig, value)
        break
      case 'temporal':
        filter = this.createTemporalFilter(filterConfig, value)
        break
      case 'text':
        filter = this.createTextFilter(filterConfig, value)
        break
    }

    // Apply filter
    await this.applyFilter(widgetId, filter.field, filter.operator, filter.value)
  }

  private createCategoricalFilter(config: FilterField, value: any): any {
    return {
      field: config.field,
      operator: Array.isArray(value) ? FilterOperator.IN : FilterOperator.EQUALS,
      value
    }
  }

  private createNumericalFilter(config: FilterField, value: any): any {
    if (Array.isArray(value) && value.length === 2) {
      return {
        field: config.field,
        operator: FilterOperator.BETWEEN,
        value
      }
    } else {
      return {
        field: config.field,
        operator: FilterOperator.EQUALS,
        value
      }
    }
  }

  private createTemporalFilter(config: FilterField, value: any): any {
    if (value.startDate && value.endDate) {
      return {
        field: config.field,
        operator: FilterOperator.BETWEEN,
        value: [new Date(value.startDate), new Date(value.endDate)]
      }
    } else {
      return {
        field: config.field,
        operator: FilterOperator.EQUALS,
        value: new Date(value)
      }
    }
  }

  private createTextFilter(config: FilterField, value: any): any {
    return {
      field: config.field,
      operator: FilterOperator.CONTAINS,
      value: String(value)
    }
  }

  // Clear filters
  async clearFilters(widgetId: string, filterField?: string): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    if (filterField) {
      // Clear specific filter
      widgetInfo.appliedFilters.delete(filterField)
      this.globalFilters.delete(filterField)
    } else {
      // Clear all filters
      widgetInfo.appliedFilters.clear()
    }

    // Reload original data
    await this.reloadWidgetData(widgetId)

    this.logInteraction({
      type: InteractionType.FILTER_CLEAR,
      source: widgetId,
      data: { clearedField: filterField },
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    })
  }

  // Reload widget data without filters
  private async reloadWidgetData(widgetId: string): Promise<void> {
    const widgetInfo = this.widgets.get(widgetId)
    if (!widgetInfo) return

    try {
      // Fetch fresh data from original source
      const freshData = await widgetInfo.widget.fetchDataFromSource()
      await widgetInfo.widget.updateData(freshData)
    } catch (error) {
      console.error('Failed to reload widget data:', error)
    }
  }

  // Utility methods
  private shouldPropagateCrossFilter(widgetId: string): boolean {
    const widgetInfo = this.widgets.get(widgetId)
    return widgetInfo?.config.crossChart?.filterPropagation || false
  }

  private async fetchDrillDownData(level: DrillDownLevel, drillData: any): Promise<any[]> {
    try {
      const response = await fetch('/api/dashboard/drill-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: level.id,
          dimension: level.dimension,
          drillData,
          query: level.query
        })
      })

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch drill-down data:', error)
      return []
    }
  }

  private updateBreadcrumb(widgetId: string, levelName: string, drillData: any): void {
    // Update breadcrumb navigation (would integrate with UI)
    console.log(`Breadcrumb update for ${widgetId}: ${levelName}`)
  }

  private getCurrentUserId(): string {
    // Get current user ID (would integrate with auth system)
    return 'current_user_id'
  }

  private logInteraction(event: InteractionEvent): void {
    this.interactionHistory.push(event)
    
    // Keep only recent interactions
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-500)
    }

    // Log to analytics system
    this.logInteractionToAnalytics(event)
  }

  private async logInteractionToAnalytics(event: InteractionEvent): Promise<void> {
    try {
      await fetch('/api/dashboard/interaction-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to log interaction analytics:', error)
    }
  }

  // Get interaction statistics
  getInteractionStats(): {
    totalInteractions: number
    mostUsedFeatures: Array<{ type: InteractionType; count: number }>
    averageSessionLength: number
    topWidgets: Array<{ widgetId: string; interactions: number }>
  } {
    const featureCounts = new Map<InteractionType, number>()
    const widgetCounts = new Map<string, number>()

    this.interactionHistory.forEach(event => {
      featureCounts.set(event.type, (featureCounts.get(event.type) || 0) + 1)
      widgetCounts.set(event.source, (widgetCounts.get(event.source) || 0) + 1)
    })

    const mostUsedFeatures = Array.from(featureCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topWidgets = Array.from(widgetCounts.entries())
      .map(([widgetId, interactions]) => ({ widgetId, interactions }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 5)

    return {
      totalInteractions: this.interactionHistory.length,
      mostUsedFeatures,
      averageSessionLength: 0, // Would calculate based on session data
      topWidgets
    }
  }

  // Clear all interactions and reset state
  resetInteractivity(): void {
    this.widgets.clear()
    this.globalFilters.clear()
    this.interactionHistory = []
    this.crossChartConnections.clear()
  }
}

export default DashboardInteractivityManager