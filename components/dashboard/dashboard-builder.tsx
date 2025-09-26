"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Copy, 
  Move, 
  Maximize2, 
  Minimize2,
  Grid,
  Eye,
  Save,
  Undo,
  Redo,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DashboardManager, VisualizationConfig, DashboardLayout, DashboardWidget } from '@/lib/dashboard-visualization'

// Grid System Configuration
export interface GridConfig {
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  gap: number
  responsive: boolean
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export interface DashboardBuilderProps {
  dashboardId: string
  userId: string
  organizationId: string
  initialLayout?: DashboardLayout
  onSave?: (layout: DashboardLayout) => void
  readOnly?: boolean
}

// Main Dashboard Builder Component
export function DashboardBuilder({
  dashboardId,
  userId,
  organizationId,
  initialLayout,
  onSave,
  readOnly = false
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialLayout?.widgets || [])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    columns: 12,
    rows: 20,
    cellWidth: 80,
    cellHeight: 60,
    gap: 8,
    responsive: true,
    breakpoints: {
      mobile: 480,
      tablet: 768,
      desktop: 1024
    }
  })
  const [history, setHistory] = useState<DashboardLayout[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const dashboardManager = useRef<DashboardManager>()

  useEffect(() => {
    dashboardManager.current = new DashboardManager(dashboardId, userId, organizationId)
    loadDashboard()
  }, [dashboardId, userId, organizationId])

  // Load dashboard from database
  const loadDashboard = async () => {
    try {
      if (dashboardManager.current) {
        const layout = await dashboardManager.current.loadDashboard()
        if (layout) {
          setWidgets(layout.widgets || [])
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  // Save dashboard to database
  const saveDashboard = async () => {
    try {
      const layout: DashboardLayout = {
        name: `Dashboard ${dashboardId}`,
        description: 'Custom enterprise dashboard',
        gridSize: { columns: gridConfig.columns, rows: gridConfig.rows },
        widgets,
        theme: 'light',
        responsive: gridConfig.responsive
      }

      if (dashboardManager.current) {
        await dashboardManager.current.saveDashboard(layout)
      }

      onSave?.(layout)
      
      // Add to history for undo/redo
      addToHistory(layout)
    } catch (error) {
      console.error('Failed to save dashboard:', error)
    }
  }

  // Add widget to dashboard
  const addWidget = (widgetType: string) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: 0,
        y: Math.max(...widgets.map(w => w.position.y + w.position.height), 0),
        width: 4,
        height: 3
      },
      config: createDefaultWidgetConfig(widgetType),
      zIndex: widgets.length
    }

    setWidgets([...widgets, newWidget])
  }

  // Remove widget
  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId))
    if (selectedWidget === widgetId) {
      setSelectedWidget(null)
    }
  }

  // Duplicate widget
  const duplicateWidget = (widgetId: string) => {
    const originalWidget = widgets.find(w => w.id === widgetId)
    if (!originalWidget) return

    const duplicatedWidget: DashboardWidget = {
      ...originalWidget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        ...originalWidget.position,
        x: Math.min(originalWidget.position.x + 1, gridConfig.columns - originalWidget.position.width),
        y: originalWidget.position.y + 1
      },
      config: {
        ...originalWidget.config,
        title: `${originalWidget.config.title} (Copy)`
      },
      zIndex: widgets.length
    }

    setWidgets([...widgets, duplicatedWidget])
  }

  // Update widget position and size
  const updateWidgetPosition = (widgetId: string, position: DashboardWidget['position']) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, position } : w
    ))
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false)
    
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Calculate new position based on drop location
    const draggedWidget = widgets.find(w => w.id === active.id)
    if (!draggedWidget) return

    // Convert drop coordinates to grid position
    const rect = event.over?.rect
    if (rect) {
      const newX = Math.floor(rect.left / (gridConfig.cellWidth + gridConfig.gap))
      const newY = Math.floor(rect.top / (gridConfig.cellHeight + gridConfig.gap))
      
      updateWidgetPosition(active.id as string, {
        ...draggedWidget.position,
        x: Math.max(0, Math.min(newX, gridConfig.columns - draggedWidget.position.width)),
        y: Math.max(0, newY)
      })
    }
  }

  // Handle widget resize
  const handleWidgetResize = (widgetId: string, newSize: { width: number; height: number }) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget) return

    // Ensure widget doesn't exceed grid boundaries
    const maxWidth = gridConfig.columns - widget.position.x
    const constrainedWidth = Math.min(newSize.width, maxWidth)

    updateWidgetPosition(widgetId, {
      ...widget.position,
      width: Math.max(1, constrainedWidth),
      height: Math.max(1, newSize.height)
    })
  }

  // Auto-layout widgets
  const autoLayout = () => {
    const sortedWidgets = [...widgets].sort((a, b) => a.zIndex - b.zIndex)
    let currentX = 0
    let currentY = 0
    let rowHeight = 0

    const layoutWidgets = sortedWidgets.map(widget => {
      // Check if widget fits in current row
      if (currentX + widget.position.width > gridConfig.columns) {
        currentX = 0
        currentY += rowHeight
        rowHeight = 0
      }

      const newPosition = {
        ...widget.position,
        x: currentX,
        y: currentY
      }

      currentX += widget.position.width
      rowHeight = Math.max(rowHeight, widget.position.height)

      return { ...widget, position: newPosition }
    })

    setWidgets(layoutWidgets)
  }

  // History management
  const addToHistory = (layout: DashboardLayout) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(layout)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const previousLayout = history[historyIndex - 1]
      setWidgets(previousLayout.widgets)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextLayout = history[historyIndex + 1]
      setWidgets(nextLayout.widgets)
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Export dashboard
  const exportDashboard = async (format: 'json' | 'pdf' | 'png') => {
    try {
      const layout: DashboardLayout = {
        name: `Dashboard ${dashboardId}`,
        gridSize: { columns: gridConfig.columns, rows: gridConfig.rows },
        widgets,
        theme: 'light',
        responsive: gridConfig.responsive
      }

      switch (format) {
        case 'json':
          const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' })
          downloadFile(blob, `dashboard_${dashboardId}.json`)
          break
        
        case 'pdf':
          await exportToPDF()
          break
        
        case 'png':
          await exportToPNG()
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async () => {
    // Would integrate with PDF generation library
    console.log('Exporting to PDF...')
  }

  const exportToPNG = async () => {
    // Would capture dashboard as image
    console.log('Exporting to PNG...')
  }

  return (
    <div className="dashboard-builder h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard Builder</h1>
            <Badge variant="outline">
              {widgets.length} widgets
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* History Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Layout Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={autoLayout}
            >
              <Grid className="h-4 w-4 mr-1" />
              Auto Layout
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Save and Export */}
            <Button
              variant="ghost"
              size="sm"
              onClick={saveDashboard}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportDashboard('json')}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Widget Palette */}
        {!isPreviewMode && (
          <div className="w-64 border-r bg-white overflow-y-auto">
            <WidgetPalette onAddWidget={addWidget} />
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 overflow-auto">
          <DragAndDropCanvas
            widgets={widgets}
            gridConfig={gridConfig}
            selectedWidget={selectedWidget}
            onSelectWidget={setSelectedWidget}
            onUpdateWidget={updateWidgetPosition}
            onRemoveWidget={removeWidget}
            onDuplicateWidget={duplicateWidget}
            onResizeWidget={handleWidgetResize}
            onDragEnd={handleDragEnd}
            readOnly={readOnly || isPreviewMode}
          />
        </div>

        {/* Properties Panel */}
        {!isPreviewMode && selectedWidget && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            <WidgetPropertiesPanel
              widget={widgets.find(w => w.id === selectedWidget)}
              onUpdateConfig={(config) => {
                setWidgets(widgets.map(w => 
                  w.id === selectedWidget ? { ...w, config } : w
                ))
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Widget Palette Component
function WidgetPalette({ onAddWidget }: { onAddWidget: (type: string) => void }) {
  const widgetTypes = [
    { type: 'line_chart', name: 'Line Chart', icon: '📈', category: 'Basic Charts' },
    { type: 'bar_chart', name: 'Bar Chart', icon: '📊', category: 'Basic Charts' },
    { type: 'pie_chart', name: 'Pie Chart', icon: '🥧', category: 'Basic Charts' },
    { type: 'scatter_plot', name: 'Scatter Plot', icon: '⚡', category: 'Basic Charts' },
    
    { type: 'funnel_chart', name: 'Funnel Chart', icon: '🔻', category: 'Business Charts' },
    { type: 'gauge_chart', name: 'Gauge Chart', icon: '⏱️', category: 'Business Charts' },
    { type: 'treemap', name: 'Treemap', icon: '🗂️', category: 'Business Charts' },
    { type: 'sankey_diagram', name: 'Sankey Diagram', icon: '🌊', category: 'Business Charts' },
    
    { type: 'heat_map', name: 'Heat Map', icon: '🔥', category: 'Advanced Charts' },
    { type: 'network_graph', name: 'Network Graph', icon: '🕸️', category: 'Advanced Charts' },
    { type: 'cohort_analysis', name: 'Cohort Analysis', icon: '👥', category: 'Advanced Charts' },
    { type: 'choropleth_map', name: 'Geographic Map', icon: '🗺️', category: 'Advanced Charts' },
    
    { type: 'regression_plot', name: 'Regression Analysis', icon: '📉', category: 'Statistical' },
    { type: 'correlation_matrix', name: 'Correlation Matrix', icon: '🔗', category: 'Statistical' },
    { type: 'distribution_plot', name: 'Distribution Plot', icon: '📊', category: 'Statistical' },
    { type: 'box_plot', name: 'Box Plot', icon: '📦', category: 'Statistical' },
    
    { type: 'kpi_widget', name: 'KPI Widget', icon: '🎯', category: 'KPI & Metrics' },
    { type: 'real_time_metric', name: 'Real-time Metric', icon: '⚡', category: 'KPI & Metrics' },
    { type: 'activity_feed', name: 'Activity Feed', icon: '📝', category: 'KPI & Metrics' }
  ]

  const categories = [...new Set(widgetTypes.map(w => w.category))]

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 mb-4">Widget Library</h3>
      
      {categories.map(category => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            {category}
          </h4>
          <div className="space-y-1">
            {widgetTypes
              .filter(w => w.category === category)
              .map(widget => (
                <button
                  key={widget.type}
                  onClick={() => onAddWidget(widget.type)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{widget.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{widget.name}</div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Drag and Drop Canvas
function DragAndDropCanvas({
  widgets,
  gridConfig,
  selectedWidget,
  onSelectWidget,
  onUpdateWidget,
  onRemoveWidget,
  onDuplicateWidget,
  onResizeWidget,
  onDragEnd,
  readOnly
}: {
  widgets: DashboardWidget[]
  gridConfig: GridConfig
  selectedWidget: string | null
  onSelectWidget: (id: string | null) => void
  onUpdateWidget: (id: string, position: DashboardWidget['position']) => void
  onRemoveWidget: (id: string) => void
  onDuplicateWidget: (id: string) => void
  onResizeWidget: (id: string, size: { width: number; height: number }) => void
  onDragEnd: (event: DragEndEvent) => void
  readOnly: boolean
}) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Calculate grid dimensions
  const gridWidth = gridConfig.columns * (gridConfig.cellWidth + gridConfig.gap) - gridConfig.gap
  const gridHeight = gridConfig.rows * (gridConfig.cellHeight + gridConfig.gap) - gridConfig.gap

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div
          ref={canvasRef}
          className="relative bg-white border border-gray-200 rounded-lg shadow-sm"
          style={{
            width: gridWidth,
            height: gridHeight,
            backgroundImage: `
              linear-gradient(to right, #f3f4f6 1px, transparent 1px),
              linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
            `,
            backgroundSize: `${gridConfig.cellWidth + gridConfig.gap}px ${gridConfig.cellHeight + gridConfig.gap}px`
          }}
        >
          <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <AnimatePresence>
              {widgets.map(widget => (
                <DraggableWidget
                  key={widget.id}
                  widget={widget}
                  gridConfig={gridConfig}
                  isSelected={selectedWidget === widget.id}
                  onSelect={() => onSelectWidget(widget.id)}
                  onRemove={() => onRemoveWidget(widget.id)}
                  onDuplicate={() => onDuplicateWidget(widget.id)}
                  onResize={(size) => onResizeWidget(widget.id, size)}
                  readOnly={readOnly}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  )
}

// Draggable Widget Component
function DraggableWidget({
  widget,
  gridConfig,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
  onResize,
  readOnly
}: {
  widget: DashboardWidget
  gridConfig: GridConfig
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onDuplicate: () => void
  onResize: (size: { width: number; height: number }) => void
  readOnly: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'absolute' as const,
    left: widget.position.x * (gridConfig.cellWidth + gridConfig.gap),
    top: widget.position.y * (gridConfig.cellHeight + gridConfig.gap),
    width: widget.position.width * gridConfig.cellWidth + (widget.position.width - 1) * gridConfig.gap,
    height: widget.position.height * gridConfig.cellHeight + (widget.position.height - 1) * gridConfig.gap,
    zIndex: isDragging ? 1000 : widget.zIndex
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      className={`bg-white border-2 rounded-lg shadow-sm transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      } ${isDragging ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      {/* Widget Header */}
      {!readOnly && (
        <div
          className="absolute -top-8 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ height: '24px' }}
        >
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" {...listeners} {...attributes}>
              <Move className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDuplicate}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRemove}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      )}

      {/* Widget Content */}
      <div className="p-4 h-full overflow-hidden">
        <WidgetRenderer config={widget.config} />
      </div>

      {/* Resize Handles */}
      {!readOnly && isSelected && (
        <>
          <ResizeHandle
            position="bottom-right"
            onResize={(deltaX, deltaY) => {
              const newWidth = Math.max(1, widget.position.width + Math.round(deltaX / (gridConfig.cellWidth + gridConfig.gap)))
              const newHeight = Math.max(1, widget.position.height + Math.round(deltaY / (gridConfig.cellHeight + gridConfig.gap)))
              onResize({ width: newWidth, height: newHeight })
            }}
          />
        </>
      )}
    </motion.div>
  )
}

// Resize Handle Component
function ResizeHandle({ 
  position, 
  onResize 
}: { 
  position: string
  onResize: (deltaX: number, deltaY: number) => void 
}) {
  const [isResizing, setIsResizing] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startPos.current = { x: e.clientX, y: e.clientY }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y
      onResize(deltaX, deltaY)
      startPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize ${
        position === 'bottom-right' ? 'bottom-0 right-0' : ''
      } ${isResizing ? 'bg-blue-600' : ''}`}
      onMouseDown={handleMouseDown}
    />
  )
}

// Widget Renderer Component
function WidgetRenderer({ config }: { config: VisualizationConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // Render widget based on type
      renderWidget(config, containerRef.current)
    }
  }, [config])

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Widget content will be rendered here */}
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm font-medium">{config.title}</div>
          <div className="text-xs text-gray-400">{config.type}</div>
        </div>
      </div>
    </div>
  )
}

// Widget Properties Panel
function WidgetPropertiesPanel({
  widget,
  onUpdateConfig
}: {
  widget?: DashboardWidget
  onUpdateConfig: (config: VisualizationConfig) => void
}) {
  if (!widget) return null

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Widget Properties</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={widget.config.title}
            onChange={(e) => onUpdateConfig({
              ...widget.config,
              title: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={widget.config.description || ''}
            onChange={(e) => onUpdateConfig({
              ...widget.config,
              description: e.target.value
            })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Source
          </label>
          <select
            value={widget.config.dataSource.source}
            onChange={(e) => onUpdateConfig({
              ...widget.config,
              dataSource: {
                ...widget.config.dataSource,
                source: e.target.value as any
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="analytics">Analytics Data</option>
            <option value="trinity_agent">Trinity Agent</option>
            <option value="database">Database Query</option>
            <option value="api">External API</option>
          </select>
        </div>

        {/* Additional configuration options would go here */}
      </div>
    </div>
  )
}

// Utility functions
function createDefaultWidgetConfig(widgetType: string): VisualizationConfig {
  return {
    type: widgetType as any,
    title: `New ${widgetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    dataSource: {
      source: 'analytics',
      connection: 'default',
      refreshInterval: 60
    },
    chartConfig: {
      dimensions: [],
      measures: [],
      colorScheme: { type: 'categorical', colors: ['#3B82F6', '#10B981', '#F59E0B'] },
      layout: {
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 40, left: 40 },
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      }
    },
    interactivity: {
      drillDown: false,
      crossFilter: false,
      zoom: false,
      hover: true,
      click: true,
      selection: false,
      brushing: false,
      linking: []
    },
    styling: {
      theme: 'light',
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      fonts: { family: 'Inter', size: 12, weight: 'normal', color: '#374151' },
      spacing: { padding: 16, margin: 8, gap: 4 },
      borders: { width: 1, color: '#E5E7EB', radius: 8, style: 'solid' },
      responsive: true
    },
    permissions: {
      viewRoles: ['USER', 'ANALYST', 'MANAGER'],
      editRoles: ['ANALYST', 'MANAGER'],
      exportRoles: ['MANAGER'],
      isPublic: false,
      shareSettings: {
        allowPublicAccess: false,
        allowEmbedding: false,
        allowExporting: true
      }
    }
  }
}

async function renderWidget(config: VisualizationConfig, container: HTMLElement): Promise<void> {
  // This would integrate with the actual widget rendering system
  // For now, just show a placeholder
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px;">
      <div style="text-align: center; color: #6b7280;">
        <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
        <div style="font-weight: 500;">${config.title}</div>
        <div style="font-size: 12px; opacity: 0.7;">${config.type}</div>
      </div>
    </div>
  `
}

export default DashboardBuilder