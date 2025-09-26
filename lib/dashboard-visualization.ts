// Advanced Enterprise Dashboard Visualization System
// Industry-leading business intelligence with custom widget framework

export interface VisualizationConfig {
  type: VisualizationType
  title: string
  description?: string
  dataSource: DataSourceConfig
  chartConfig: ChartConfiguration
  interactivity: InteractivityConfig
  styling: VisualizationStyling
  permissions: VisualizationPermissions
}

export interface DataSourceConfig {
  source: 'analytics' | 'trinity_agent' | 'database' | 'api' | 'file_upload' | 'custom'
  connection: string
  query?: string
  filters?: DataFilter[]
  aggregations?: DataAggregation[]
  refreshInterval?: number // seconds
  realTimeEnabled?: boolean
}

export interface ChartConfiguration {
  dimensions: ChartDimension[]
  measures: ChartMeasure[]
  colorScheme: ColorScheme
  layout: ChartLayout
  axes?: AxesConfig
  legend?: LegendConfig
  annotations?: ChartAnnotation[]
  customOptions?: Record<string, any>
}

export interface InteractivityConfig {
  drillDown: boolean
  crossFilter: boolean
  zoom: boolean
  hover: boolean
  click: boolean
  selection: boolean
  brushing: boolean
  linking: string[] // IDs of linked visualizations
}

export interface VisualizationStyling {
  theme: 'light' | 'dark' | 'custom'
  colors: string[]
  fonts: FontConfig
  spacing: SpacingConfig
  borders: BorderConfig
  responsive: boolean
}

export interface VisualizationPermissions {
  viewRoles: string[]
  editRoles: string[]
  exportRoles: string[]
  isPublic: boolean
  shareSettings: ShareSettings
}

// Comprehensive Chart Types
export enum VisualizationType {
  // Basic Charts
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  SCATTER_PLOT = 'scatter_plot',
  
  // Advanced Business Charts
  FUNNEL_CHART = 'funnel_chart',
  WATERFALL_CHART = 'waterfall_chart',
  SANKEY_DIAGRAM = 'sankey_diagram',
  TREEMAP = 'treemap',
  SUNBURST = 'sunburst',
  
  // Statistical Visualizations
  HISTOGRAM = 'histogram',
  BOX_PLOT = 'box_plot',
  VIOLIN_PLOT = 'violin_plot',
  CORRELATION_MATRIX = 'correlation_matrix',
  REGRESSION_PLOT = 'regression_plot',
  
  // Geographic Visualizations
  CHOROPLETH_MAP = 'choropleth_map',
  BUBBLE_MAP = 'bubble_map',
  HEAT_MAP = 'heat_map',
  
  // Network and Relationship Charts
  NETWORK_GRAPH = 'network_graph',
  HIERARCHY_TREE = 'hierarchy_tree',
  CHORD_DIAGRAM = 'chord_diagram',
  
  // Specialized Business Charts
  COHORT_ANALYSIS = 'cohort_analysis',
  GAUGE_CHART = 'gauge_chart',
  BULLET_CHART = 'bullet_chart',
  CANDLESTICK_CHART = 'candlestick_chart',
  
  // Custom and Interactive
  CUSTOM_WIDGET = 'custom_widget',
  COMPOSITE_CHART = 'composite_chart',
  REAL_TIME_STREAM = 'real_time_stream'
}

// Widget Framework Architecture
export abstract class BaseWidget {
  protected config: VisualizationConfig
  protected data: any[]
  protected element: HTMLElement | null = null
  
  constructor(config: VisualizationConfig) {
    this.config = config
  }

  abstract render(container: HTMLElement): Promise<void>
  abstract updateData(newData: any[]): Promise<void>
  abstract destroy(): void
  
  // Common widget lifecycle methods
  async initialize(): Promise<void> {
    await this.loadData()
    await this.setupInteractivity()
  }

  protected async loadData(): Promise<void> {
    this.data = await this.fetchDataFromSource()
  }

  protected async fetchDataFromSource(): Promise<any[]> {
    const dataSource = this.config.dataSource
    
    switch (dataSource.source) {
      case 'analytics':
        return await this.fetchAnalyticsData()
      case 'trinity_agent':
        return await this.fetchTrinityAgentData()
      case 'database':
        return await this.fetchDatabaseData()
      case 'api':
        return await this.fetchAPIData()
      default:
        return []
    }
  }

  protected async fetchAnalyticsData(): Promise<any[]> {
    // Integrate with our analytics system
    const response = await fetch(`/api/analytics/data?source=${this.config.dataSource.connection}`)
    const result = await response.json()
    return result.data || []
  }

  protected async fetchTrinityAgentData(): Promise<any[]> {
    // Get insights from Trinity Agents
    const response = await fetch(`/api/trinity/insights?query=${this.config.dataSource.query}`)
    const result = await response.json()
    return result.insights || []
  }

  protected async fetchDatabaseData(): Promise<any[]> {
    // Execute database query
    const response = await fetch('/api/dashboard/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: this.config.dataSource.query,
        connection: this.config.dataSource.connection
      })
    })
    const result = await response.json()
    return result.data || []
  }

  protected async fetchAPIData(): Promise<any[]> {
    // Fetch from external API
    const response = await fetch(this.config.dataSource.connection)
    return await response.json()
  }

  protected async setupInteractivity(): Promise<void> {
    if (!this.config.interactivity || !this.element) return

    // Setup cross-filtering
    if (this.config.interactivity.crossFilter) {
      this.setupCrossFiltering()
    }

    // Setup drill-down
    if (this.config.interactivity.drillDown) {
      this.setupDrillDown()
    }

    // Setup zoom
    if (this.config.interactivity.zoom) {
      this.setupZoom()
    }
  }

  protected setupCrossFiltering(): void {
    // Implementation for cross-chart filtering
  }

  protected setupDrillDown(): void {
    // Implementation for drill-down functionality
  }

  protected setupZoom(): void {
    // Implementation for zoom capabilities
  }

  // Widget registration and lifecycle
  static register(type: VisualizationType, widgetClass: typeof BaseWidget): void {
    WidgetRegistry.register(type, widgetClass)
  }

  // Export widget data
  async exportData(format: 'csv' | 'json' | 'excel'): Promise<Blob> {
    switch (format) {
      case 'csv':
        return this.exportToCSV()
      case 'json':
        return this.exportToJSON()
      case 'excel':
        return this.exportToExcel()
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private async exportToCSV(): Promise<Blob> {
    const csv = this.convertDataToCSV(this.data)
    return new Blob([csv], { type: 'text/csv' })
  }

  private async exportToJSON(): Promise<Blob> {
    const json = JSON.stringify(this.data, null, 2)
    return new Blob([json], { type: 'application/json' })
  }

  private async exportToExcel(): Promise<Blob> {
    // Would integrate with ExcelJS or similar library
    throw new Error('Excel export not implemented yet')
  }

  private convertDataToCSV(data: any[]): string {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => 
        typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
      ).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }
}

// Widget Registry for managing custom widgets
export class WidgetRegistry {
  private static widgets: Map<VisualizationType, typeof BaseWidget> = new Map()

  static register(type: VisualizationType, widgetClass: typeof BaseWidget): void {
    this.widgets.set(type, widgetClass)
  }

  static create(config: VisualizationConfig): BaseWidget {
    const WidgetClass = this.widgets.get(config.type)
    if (!WidgetClass) {
      throw new Error(`Widget type not registered: ${config.type}`)
    }
    return new WidgetClass(config)
  }

  static getRegisteredTypes(): VisualizationType[] {
    return Array.from(this.widgets.keys())
  }

  static isRegistered(type: VisualizationType): boolean {
    return this.widgets.has(type)
  }
}

// Dashboard Management System
export class DashboardManager {
  private widgets: Map<string, BaseWidget> = new Map()
  private dashboardId: string
  private userId: string
  private organizationId: string

  constructor(dashboardId: string, userId: string, organizationId: string) {
    this.dashboardId = dashboardId
    this.userId = userId
    this.organizationId = organizationId
  }

  // Add widget to dashboard
  async addWidget(widgetId: string, config: VisualizationConfig): Promise<BaseWidget> {
    try {
      const widget = WidgetRegistry.create(config)
      await widget.initialize()
      
      this.widgets.set(widgetId, widget)
      
      // Save widget configuration to database
      await this.saveWidgetConfig(widgetId, config)
      
      return widget
    } catch (error) {
      console.error('Failed to add widget:', error)
      throw error
    }
  }

  // Remove widget from dashboard
  async removeWidget(widgetId: string): Promise<void> {
    const widget = this.widgets.get(widgetId)
    if (widget) {
      widget.destroy()
      this.widgets.delete(widgetId)
      await this.deleteWidgetConfig(widgetId)
    }
  }

  // Update widget configuration
  async updateWidget(widgetId: string, newConfig: Partial<VisualizationConfig>): Promise<void> {
    const widget = this.widgets.get(widgetId)
    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`)
    }

    // Update configuration
    Object.assign(widget['config'], newConfig)
    
    // Re-initialize widget with new config
    await widget.initialize()
    
    // Save updated configuration
    await this.saveWidgetConfig(widgetId, widget['config'])
  }

  // Get all widgets in dashboard
  getWidgets(): Map<string, BaseWidget> {
    return this.widgets
  }

  // Save dashboard configuration
  async saveDashboard(layout: DashboardLayout): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.dashboard.upsert({
      where: { id: this.dashboardId },
      update: {
        layout: layout,
        updatedAt: new Date()
      },
      create: {
        id: this.dashboardId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        name: layout.name || 'Untitled Dashboard',
        description: layout.description,
        layout: layout,
        status: 'ACTIVE'
      }
    })
  }

  // Load dashboard from database
  async loadDashboard(): Promise<DashboardLayout | null> {
    const { prisma } = await import('./prisma')
    
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: this.dashboardId },
      include: { items: true }
    })

    if (!dashboard) return null

    // Load and initialize widgets
    for (const item of dashboard.items) {
      if (item.config) {
        const widget = WidgetRegistry.create(item.config as VisualizationConfig)
        await widget.initialize()
        this.widgets.set(item.id, widget)
      }
    }

    return dashboard.layout as DashboardLayout
  }

  // Private helper methods
  private async saveWidgetConfig(widgetId: string, config: VisualizationConfig): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.dashboardItem.upsert({
      where: { id: widgetId },
      update: {
        config: config,
        title: config.title
      },
      create: {
        id: widgetId,
        dashboardId: this.dashboardId,
        title: config.title,
        type: config.type as any,
        config: config,
        x: 0, // Default position
        y: 0,
        width: 4, // Default size
        height: 3
      }
    })
  }

  private async deleteWidgetConfig(widgetId: string): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.dashboardItem.delete({
      where: { id: widgetId }
    })
  }
}

// Supporting interfaces
export interface DashboardLayout {
  name: string
  description?: string
  gridSize: { columns: number; rows: number }
  widgets: DashboardWidget[]
  theme: string
  responsive: boolean
}

export interface DashboardWidget {
  id: string
  position: { x: number; y: number; width: number; height: number }
  config: VisualizationConfig
  zIndex: number
}

export interface ChartDimension {
  field: string
  type: 'categorical' | 'temporal' | 'quantitative' | 'ordinal'
  format?: string
  sort?: 'asc' | 'desc' | 'none'
}

export interface ChartMeasure {
  field: string
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'distinct'
  format?: string
  color?: string
}

export interface ColorScheme {
  type: 'categorical' | 'sequential' | 'diverging' | 'custom'
  colors: string[]
  interpolation?: 'linear' | 'exponential' | 'logarithmic'
}

export interface ChartLayout {
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  padding: { top: number; right: number; bottom: number; left: number }
}

export interface AxesConfig {
  x: AxisConfig
  y: AxisConfig
  y2?: AxisConfig
}

export interface AxisConfig {
  title: string
  type: 'linear' | 'log' | 'time' | 'band'
  domain?: [number, number]
  tickCount?: number
  format?: string
  grid?: boolean
}

export interface LegendConfig {
  show: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
  orientation: 'horizontal' | 'vertical'
}

export interface ChartAnnotation {
  type: 'line' | 'rect' | 'text' | 'arrow'
  value: any
  text?: string
  style: any
}

export interface DataFilter {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains'
  value: any
}

export interface DataAggregation {
  field: string
  method: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'stddev'
  groupBy?: string[]
}

export interface FontConfig {
  family: string
  size: number
  weight: string
  color: string
}

export interface SpacingConfig {
  padding: number
  margin: number
  gap: number
}

export interface BorderConfig {
  width: number
  color: string
  radius: number
  style: 'solid' | 'dashed' | 'dotted'
}

export interface ShareSettings {
  allowPublicAccess: boolean
  allowEmbedding: boolean
  allowExporting: boolean
  expirationDate?: Date
}

export default DashboardManager