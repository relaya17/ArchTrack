'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Eye,
  EyeOff,
  Layers,
  Download,
  Share2,
  Settings
} from 'lucide-react'

interface BIMComponent {
  id: string
  name: string
  type: 'wall' | 'beam' | 'column' | 'slab' | 'door' | 'window'
  material: string
  volume: number
  cost: number
  isVisible: boolean
  color: string
}

interface BIMViewerProps {
  projectId: string
  onComponentSelect: (component: BIMComponent) => void
  onComponentUpdate: (component: BIMComponent) => void
}

const mockBIMComponents: BIMComponent[] = [
  {
    id: '1',
    name: 'קיר חיצוני - צפון',
    type: 'wall',
    material: 'בטון מזוין',
    volume: 12.5,
    cost: 15000,
    isVisible: true,
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'קורה ראשית - קומה 1',
    type: 'beam',
    material: 'פלדה',
    volume: 8.2,
    cost: 25000,
    isVisible: true,
    color: '#10B981'
  },
  {
    id: '3',
    name: 'עמוד תמיכה - A1',
    type: 'column',
    material: 'בטון מזוין',
    volume: 3.8,
    cost: 8000,
    isVisible: true,
    color: '#F59E0B'
  },
  {
    id: '4',
    name: 'רצפה - קומה 1',
    type: 'slab',
    material: 'בטון מזוין',
    volume: 45.0,
    cost: 35000,
    isVisible: true,
    color: '#8B5CF6'
  }
]

export default function BIMViewer({ 
  projectId, 
  onComponentSelect, 
  onComponentUpdate 
}: BIMViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<BIMComponent | null>(null)
  const [components, setComponents] = useState<BIMComponent[]>(mockBIMComponents)
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'section'>('3d')
  const [isLoading, setIsLoading] = useState(true)
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate loading BIM model
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleComponentToggle = (componentId: string) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, isVisible: !comp.isVisible }
          : comp
      )
    )
  }

  const handleComponentClick = (component: BIMComponent) => {
    setSelectedComponent(component)
    onComponentSelect(component)
  }

  const handleResetView = () => {
    // Reset camera position
    console.log('Resetting view')
  }

  const handleZoomIn = () => {
    console.log('Zooming in')
  }

  const handleZoomOut = () => {
    console.log('Zooming out')
  }

  const getComponentIcon = (type: BIMComponent['type']) => {
    switch (type) {
      case 'wall': return '🧱'
      case 'beam': return '🏗️'
      case 'column': return '🏛️'
      case 'slab': return '🏢'
      case 'door': return '🚪'
      case 'window': return '🪟'
      default: return '📦'
    }
  }

  const getTypeLabel = (type: BIMComponent['type']) => {
    switch (type) {
      case 'wall': return 'קיר'
      case 'beam': return 'קורה'
      case 'column': return 'עמוד'
      case 'slab': return 'רצפה'
      case 'door': return 'דלת'
      case 'window': return 'חלון'
      default: return 'רכיב'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מודל BIM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">BIM Viewer</h3>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant={viewMode === '3d' ? 'default' : 'outline'}
              onClick={() => setViewMode('3d')}
            >
              3D
            </Button>
            <Button
              size="sm"
              variant={viewMode === '2d' ? 'default' : 'outline'}
              onClick={() => setViewMode('2d')}
            >
              2D
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'section' ? 'default' : 'outline'}
              onClick={() => setViewMode('section')}
            >
              חתך
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-full">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <div 
            ref={viewerRef}
            className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
          >
            {/* Mock 3D Scene */}
            <div className="text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">
                מודל BIM תלת-ממדי
              </h4>
              <p className="text-gray-600 mb-4">
                {viewMode === '3d' && 'תצוגה תלת-ממדית של הפרויקט'}
                {viewMode === '2d' && 'תצוגה דו-ממדית - תכנית'}
                {viewMode === 'section' && 'תצוגת חתך של המבנה'}
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {components.filter(comp => comp.isVisible).map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => handleComponentClick(comp)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedComponent?.id === comp.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getComponentIcon(comp.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{comp.name}</p>
                        <p className="text-xs text-gray-500">{getTypeLabel(comp.type)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Components Panel */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Layers className="ml-2 h-5 w-5" />
              רכיבי המודל
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {components.map(component => (
              <div
                key={component.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedComponent?.id === component.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleComponentClick(component)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getComponentIcon(component.type)}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {component.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTypeLabel(component.type)} • {component.material}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleComponentToggle(component.id)
                    }}
                    className={`p-1 rounded ${
                      component.isVisible 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {component.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">נפח:</span>
                    <span className="font-medium mr-1">{component.volume} מ"ק</span>
                  </div>
                  <div>
                    <span className="text-gray-500">עלות:</span>
                    <span className="font-medium mr-1">₪{component.cost.toLocaleString()}</span>
                  </div>
                </div>

                <div 
                  className="w-full h-2 rounded mt-2"
                  style={{ backgroundColor: component.color }}
                />
              </div>
            ))}
          </div>

          {/* Component Details */}
          {selectedComponent && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h5 className="font-semibold text-gray-900 mb-3">פרטי הרכיב</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">סוג:</span>
                  <span className="font-medium">{getTypeLabel(selectedComponent.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">חומר:</span>
                  <span className="font-medium">{selectedComponent.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">נפח:</span>
                  <span className="font-medium">{selectedComponent.volume} מ"ק</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">עלות:</span>
                  <span className="font-medium">₪{selectedComponent.cost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
