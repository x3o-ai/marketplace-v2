// Custom Widget Development Framework with Plugin Architecture
// Enables third-party developers to create custom dashboard widgets

import { BaseWidget, VisualizationConfig, VisualizationType } from './dashboard-visualization'

// Plugin Framework Interfaces
export interface WidgetPluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: {
    name: string
    email: string
    website?: string
  }
  entryPoint: string
  supportedDataTypes: string[]
  configSchema: WidgetConfigSchema
  dependencies?: string[]
  permissions: PluginPermissions
  marketplace: {
    category: string
    tags: string[]
    price?: number
    thumbnail?: string
    screenshots?: string[]
  }
}

export interface WidgetConfigSchema {
  type: 'object'
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    title: string
    description?: string
    default?: any
    enum?: any[]
    required?: boolean
  }>
  required: string[]
}

export interface PluginPermissions {
  dataAccess: DataAccessLevel[]
  apiAccess: APIAccessLevel[]
  fileAccess: boolean
  networkAccess: boolean
  localStorage: boolean
  notifications: boolean
}

export enum DataAccessLevel {
  READ_ANALYTICS = 'read_analytics',
  READ_USER_DATA = 'read_user_data',
  READ_BUSINESS_METRICS = 'read_business_metrics',
  WRITE_CUSTOM_DATA = 'write_custom_data'
}

export enum APIAccessLevel {
  TRINITY_AGENTS = 'trinity_agents',
  DASHBOARD_API = 'dashboard_api',
  EXTERNAL_HTTP = 'external_http',
  WEBHOOK_RECEIVE = 'webhook_receive'
}

// Plugin Lifecycle Events
export interface PluginLifecycleEvents {
  onInstall?: () => Promise<void>
  onUninstall?: () => Promise<void>
  onActivate?: () => Promise<void>
  onDeactivate?: () => Promise<void>
  onConfigChange?: (newConfig: any) => Promise<void>
  onDataUpdate?: (newData: any[]) => Promise<void>
}

// Base Plugin Class
export abstract class WidgetPlugin implements PluginLifecycleEvents {
  protected manifest: WidgetPluginManifest
  protected config: any
  protected widgetInstance: BaseWidget | null = null

  constructor(manifest: WidgetPluginManifest) {
    this.manifest = manifest
  }

  // Abstract methods that plugins must implement
  abstract createWidget(config: VisualizationConfig): BaseWidget
  abstract validateConfig(config: any): { valid: boolean; errors: string[] }
  abstract getDefaultConfig(): any

  // Plugin lifecycle methods
  async onInstall(): Promise<void> {
    console.log(`Installing plugin: ${this.manifest.name}`)
    await this.setupPlugin()
  }

  async onUninstall(): Promise<void> {
    console.log(`Uninstalling plugin: ${this.manifest.name}`)
    await this.cleanupPlugin()
  }

  async onActivate(): Promise<void> {
    console.log(`Activating plugin: ${this.manifest.name}`)
  }

  async onDeactivate(): Promise<void> {
    console.log(`Deactivating plugin: ${this.manifest.name}`)
    if (this.widgetInstance) {
      this.widgetInstance.destroy()
    }
  }

  async onConfigChange(newConfig: any): Promise<void> {
    this.config = newConfig
    if (this.widgetInstance) {
      await this.widgetInstance.updateData([])
    }
  }

  async onDataUpdate(newData: any[]): Promise<void> {
    if (this.widgetInstance) {
      await this.widgetInstance.updateData(newData)
    }
  }

  // Plugin utilities
  protected async setupPlugin(): Promise<void> {
    // Register widget type
    const { WidgetRegistry } = await import('./dashboard-visualization')
    const customType = `custom_${this.manifest.id}` as VisualizationType
    WidgetRegistry.register(customType, this.createCustomWidgetClass())
  }

  protected async cleanupPlugin(): Promise<void> {
    // Cleanup resources
    if (this.widgetInstance) {
      this.widgetInstance.destroy()
    }
  }

  protected createCustomWidgetClass(): typeof BaseWidget {
    const plugin = this
    
    return class CustomPluginWidget extends BaseWidget {
      async render(container: HTMLElement): Promise<void> {
        return plugin.renderWidget(container, this.config, this.data)
      }

      async updateData(newData: any[]): Promise<void> {
        this.data = newData
        await plugin.onDataUpdate(newData)
      }

      destroy(): void {
        plugin.onDeactivate()
      }
    }
  }

  // Plugin developers implement this method
  protected abstract renderWidget(container: HTMLElement, config: any, data: any[]): Promise<void>
}

// Plugin Manager for handling installed plugins
export class WidgetPluginManager {
  private plugins: Map<string, WidgetPlugin> = new Map()
  private installedPlugins: Map<string, WidgetPluginManifest> = new Map()

  // Install a plugin
  async installPlugin(manifest: WidgetPluginManifest, pluginCode: string): Promise<boolean> {
    try {
      // Validate manifest
      const validation = this.validateManifest(manifest)
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`)
      }

      // Security check
      await this.performSecurityScan(pluginCode)

      // Load plugin
      const plugin = await this.loadPlugin(manifest, pluginCode)
      
      // Install plugin
      await plugin.onInstall()
      
      // Register plugin
      this.plugins.set(manifest.id, plugin)
      this.installedPlugins.set(manifest.id, manifest)

      // Save to database
      await this.savePluginToDB(manifest, pluginCode)

      console.log(`Plugin installed successfully: ${manifest.name}`)
      return true
    } catch (error) {
      console.error('Plugin installation failed:', error)
      return false
    }
  }

  // Uninstall a plugin
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (plugin) {
        await plugin.onUninstall()
        this.plugins.delete(pluginId)
      }

      this.installedPlugins.delete(pluginId)
      await this.removePluginFromDB(pluginId)

      console.log(`Plugin uninstalled: ${pluginId}`)
      return true
    } catch (error) {
      console.error('Plugin uninstall failed:', error)
      return false
    }
  }

  // Get installed plugins
  getInstalledPlugins(): WidgetPluginManifest[] {
    return Array.from(this.installedPlugins.values())
  }

  // Get plugin by ID
  getPlugin(pluginId: string): WidgetPlugin | null {
    return this.plugins.get(pluginId) || null
  }

  // Create widget from plugin
  async createPluginWidget(pluginId: string, config: VisualizationConfig): Promise<BaseWidget | null> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    // Validate plugin config
    const validation = plugin.validateConfig(config)
    if (!validation.valid) {
      throw new Error(`Invalid plugin config: ${validation.errors.join(', ')}`)
    }

    return plugin.createWidget(config)
  }

  // Plugin development utilities
  async validateManifest(manifest: WidgetPluginManifest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Required fields
    if (!manifest.id) errors.push('Plugin ID is required')
    if (!manifest.name) errors.push('Plugin name is required')
    if (!manifest.version) errors.push('Plugin version is required')
    if (!manifest.entryPoint) errors.push('Entry point is required')

    // Version format
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Version must be in semver format (x.y.z)')
    }

    // Permissions validation
    if (manifest.permissions.networkAccess && !manifest.permissions.apiAccess.includes(APIAccessLevel.EXTERNAL_HTTP)) {
      errors.push('Network access requires EXTERNAL_HTTP API permission')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  private async performSecurityScan(pluginCode: string): Promise<void> {
    // Basic security scanning
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /localStorage\.setItem/,
      /fetch\s*\(/,
      /XMLHttpRequest/
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginCode)) {
        throw new Error(`Security violation: Potentially dangerous code pattern detected`)
      }
    }

    // Check for required security declarations
    if (!pluginCode.includes('// WIDGET_PLUGIN_SAFE')) {
      throw new Error('Plugin must include security declaration: // WIDGET_PLUGIN_SAFE')
    }
  }

  private async loadPlugin(manifest: WidgetPluginManifest, pluginCode: string): Promise<WidgetPlugin> {
    // In a real implementation, this would safely execute the plugin code
    // For now, return a mock plugin that demonstrates the interface
    
    return new (class extends WidgetPlugin {
      createWidget(config: VisualizationConfig): BaseWidget {
        return new (class extends BaseWidget {
          async render(container: HTMLElement): Promise<void> {
            container.innerHTML = `
              <div style="padding: 20px; text-align: center; border: 2px dashed #ccc;">
                <h3>${manifest.name} Widget</h3>
                <p>Custom plugin widget placeholder</p>
                <p>Version: ${manifest.version}</p>
              </div>
            `
          }

          async updateData(newData: any[]): Promise<void> {
            // Plugin-specific update logic
          }

          destroy(): void {
            // Cleanup
          }
        })(config)
      }

      validateConfig(config: any): { valid: boolean; errors: string[] } {
        return { valid: true, errors: [] }
      }

      getDefaultConfig(): any {
        return {}
      }

      protected async renderWidget(container: HTMLElement, config: any, data: any[]): Promise<void> {
        // Custom rendering logic would go here
      }
    })(manifest)
  }

  private async savePluginToDB(manifest: WidgetPluginManifest, code: string): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.systemConfig.create({
      data: {
        key: `widget_plugin_${manifest.id}`,
        value: {
          manifest,
          code: Buffer.from(code).toString('base64'), // Store encoded
          installedAt: new Date().toISOString(),
          status: 'active'
        },
        description: `Custom widget plugin: ${manifest.name}`,
        category: 'widget_plugins'
      }
    })
  }

  private async removePluginFromDB(pluginId: string): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.systemConfig.delete({
      where: { key: `widget_plugin_${pluginId}` }
    })
  }
}

// Plugin API for third-party developers
export class WidgetPluginAPI {
  private pluginId: string
  private permissions: PluginPermissions

  constructor(pluginId: string, permissions: PluginPermissions) {
    this.pluginId = pluginId
    this.permissions = permissions
  }

  // Data access methods
  async getAnalyticsData(query: string): Promise<any[]> {
    if (!this.permissions.dataAccess.includes(DataAccessLevel.READ_ANALYTICS)) {
      throw new Error('Analytics data access not permitted')
    }

    const response = await fetch('/api/plugin/analytics', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify({ query })
    })

    return await response.json()
  }

  async getUserData(): Promise<any> {
    if (!this.permissions.dataAccess.includes(DataAccessLevel.READ_USER_DATA)) {
      throw new Error('User data access not permitted')
    }

    const response = await fetch('/api/plugin/user-data', {
      headers: { 'X-Plugin-ID': this.pluginId }
    })

    return await response.json()
  }

  async getBusinessMetrics(): Promise<any[]> {
    if (!this.permissions.dataAccess.includes(DataAccessLevel.READ_BUSINESS_METRICS)) {
      throw new Error('Business metrics access not permitted')
    }

    const response = await fetch('/api/plugin/business-metrics', {
      headers: { 'X-Plugin-ID': this.pluginId }
    })

    return await response.json()
  }

  // Trinity Agent integration
  async queryTrinityAgent(agent: 'oracle' | 'sentinel' | 'sage', query: string): Promise<any> {
    if (!this.permissions.apiAccess.includes(APIAccessLevel.TRINITY_AGENTS)) {
      throw new Error('Trinity Agent access not permitted')
    }

    const response = await fetch('/api/plugin/trinity-query', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify({ agent, query })
    })

    return await response.json()
  }

  // Dashboard integration
  async updateDashboard(dashboardId: string, updates: any): Promise<void> {
    if (!this.permissions.apiAccess.includes(APIAccessLevel.DASHBOARD_API)) {
      throw new Error('Dashboard API access not permitted')
    }

    await fetch(`/api/plugin/dashboard/${dashboardId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify(updates)
    })
  }

  // External API access
  async makeExternalRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.permissions.apiAccess.includes(APIAccessLevel.EXTERNAL_HTTP)) {
      throw new Error('External HTTP access not permitted')
    }

    // Proxy through our API for security
    return await fetch('/api/plugin/external-request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify({ url, options })
    })
  }

  // Storage utilities
  async setPluginData(key: string, value: any): Promise<void> {
    if (!this.permissions.localStorage) {
      throw new Error('Local storage access not permitted')
    }

    await fetch('/api/plugin/storage', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify({ key, value })
    })
  }

  async getPluginData(key: string): Promise<any> {
    if (!this.permissions.localStorage) {
      throw new Error('Local storage access not permitted')
    }

    const response = await fetch(`/api/plugin/storage?key=${key}`, {
      headers: { 'X-Plugin-ID': this.pluginId }
    })

    return await response.json()
  }

  // Notification system
  async sendNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    if (!this.permissions.notifications) {
      throw new Error('Notification permission not granted')
    }

    await fetch('/api/plugin/notifications', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Plugin-ID': this.pluginId
      },
      body: JSON.stringify({ message, type })
    })
  }
}

// Plugin Development Utilities
export class PluginDevelopmentKit {
  // Generate plugin template
  static generatePluginTemplate(
    pluginName: string,
    widgetType: string,
    author: { name: string; email: string }
  ): { manifest: WidgetPluginManifest; code: string } {
    const pluginId = pluginName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    const manifest: WidgetPluginManifest = {
      id: pluginId,
      name: pluginName,
      version: '1.0.0',
      description: `Custom ${widgetType} widget`,
      author,
      entryPoint: 'index.js',
      supportedDataTypes: ['json', 'csv'],
      configSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: 'Widget Title',
            default: pluginName,
            required: true
          },
          color: {
            type: 'string',
            title: 'Primary Color',
            default: '#3B82F6',
            required: false
          }
        },
        required: ['title']
      },
      permissions: {
        dataAccess: [DataAccessLevel.READ_ANALYTICS],
        apiAccess: [APIAccessLevel.DASHBOARD_API],
        fileAccess: false,
        networkAccess: false,
        localStorage: true,
        notifications: false
      },
      marketplace: {
        category: 'Custom Visualization',
        tags: [widgetType, 'custom'],
        thumbnail: `${pluginId}_thumbnail.png`
      }
    }

    const code = `
// WIDGET_PLUGIN_SAFE
// Custom Widget Plugin: ${pluginName}

class ${pluginName.replace(/\s+/g, '')}Plugin extends WidgetPlugin {
  createWidget(config) {
    return new CustomWidget(config)
  }

  validateConfig(config) {
    const errors = []
    if (!config.title) errors.push('Title is required')
    return { valid: errors.length === 0, errors }
  }

  getDefaultConfig() {
    return {
      title: '${pluginName}',
      color: '#3B82F6'
    }
  }

  async renderWidget(container, config, data) {
    // Custom rendering logic
    container.innerHTML = \`
      <div style="padding: 20px; text-align: center; background: \${config.color}10; border: 2px solid \${config.color}; border-radius: 8px;">
        <h3 style="color: \${config.color}; margin: 0 0 10px 0;">\${config.title}</h3>
        <p>Data points: \${data.length}</p>
        <div id="custom-visualization-\${this.manifest.id}"></div>
      </div>
    \`

    // Add your custom D3.js or other visualization code here
    this.renderCustomVisualization(container, config, data)
  }

  renderCustomVisualization(container, config, data) {
    // Example: Simple bar chart
    const svg = d3.select(container)
      .select('#custom-visualization-' + this.manifest.id)
      .append('svg')
      .attr('width', 300)
      .attr('height', 200)

    // Add your custom visualization logic here
    svg.selectAll('rect')
      .data(data.slice(0, 5)) // Limit to 5 items for example
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * 50)
      .attr('y', d => 150 - (d.value || 0))
      .attr('width', 40)
      .attr('height', d => d.value || 0)
      .attr('fill', config.color)
  }
}

// Export the plugin
window.${pluginName.replace(/\s+/g, '')}Plugin = ${pluginName.replace(/\s+/g, '')}Plugin
`

    return { manifest, code }
  }

  // Validate plugin code for security
  static validatePluginCode(code: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for security declaration
    if (!code.includes('// WIDGET_PLUGIN_SAFE')) {
      errors.push('Plugin must include security declaration: // WIDGET_PLUGIN_SAFE')
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'eval() is not allowed in plugins' },
      { pattern: /Function\s*\(/, message: 'Function constructor is not allowed' },
      { pattern: /document\.write/, message: 'document.write is not allowed' }
    ]

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(code)) {
        errors.push(message)
      }
    })

    // Warnings for potentially problematic patterns
    const warningPatterns = [
      { pattern: /console\.log/, message: 'Consider using plugin notifications instead of console.log' },
      { pattern: /alert\s*\(/, message: 'Use plugin notification system instead of alert()' }
    ]

    warningPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(code)) {
        warnings.push(message)
      }
    })

    return { valid: errors.length === 0, errors, warnings }
  }

  // Plugin marketplace utilities
  static async searchMarketplace(query?: string, category?: string): Promise<WidgetPluginManifest[]> {
    // This would integrate with a plugin marketplace API
    return [
      {
        id: 'advanced_kpi_tracker',
        name: 'Advanced KPI Tracker',
        version: '2.1.0',
        description: 'Professional KPI tracking with conditional formatting and alerts',
        author: { name: 'Dashboard Pro', email: 'contact@dashboardpro.com' },
        entryPoint: 'kpi-tracker.js',
        supportedDataTypes: ['json', 'csv', 'api'],
        configSchema: {
          type: 'object',
          properties: {
            kpiTarget: { type: 'number', title: 'Target Value', required: true },
            alertThreshold: { type: 'number', title: 'Alert Threshold', required: false }
          },
          required: ['kpiTarget']
        },
        permissions: {
          dataAccess: [DataAccessLevel.READ_BUSINESS_METRICS],
          apiAccess: [APIAccessLevel.DASHBOARD_API],
          fileAccess: false,
          networkAccess: false,
          localStorage: true,
          notifications: true
        },
        marketplace: {
          category: 'KPI Monitoring',
          tags: ['kpi', 'alerts', 'monitoring'],
          price: 29.99,
          thumbnail: 'kpi_tracker_thumb.png'
        }
      }
    ]
  }

  // Save plugin configuration
  private async savePluginToDB(manifest: WidgetPluginManifest, code: string): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.systemConfig.create({
      data: {
        key: `widget_plugin_${manifest.id}`,
        value: {
          manifest,
          code: Buffer.from(code).toString('base64'),
          installedAt: new Date().toISOString(),
          status: 'active'
        },
        description: `Widget plugin: ${manifest.name}`,
        category: 'widget_plugins'
      }
    })
  }

  private async removePluginFromDB(pluginId: string): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.systemConfig.deleteMany({
      where: { 
        key: `widget_plugin_${pluginId}`,
        category: 'widget_plugins'
      }
    })
  }
}

export default WidgetPluginManager