'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  MapPin, 
  Layers, 
  Settings, 
  Download,
  Share2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Info
} from 'lucide-react'

interface ARComponent {
  id: string
  name: string
  type: 'wall' | 'beam' | 'column' | 'door' | 'window'
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  isVisible: boolean
  material: string
  cost: number
}

interface ARViewerProps {
  projectId: string
  onComponentSelect: (component: ARComponent) => void
  onLocationUpdate: (location: { lat: number; lng: number }) => void
}

const mockARComponents: ARComponent[] = [
  {
    id: '1',
    name: 'קיר חיצוני - צפון',
    type: 'wall',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 10, y: 3, z: 0.2 },
    isVisible: true,
    material: 'בטון מזוין',
    cost: 15000
  },
  {
    id: '2',
    name: 'עמוד תמיכה - A1',
    type: 'column',
    position: { x: 2, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.5, y: 3, z: 0.5 },
    isVisible: true,
    material: 'בטון מזוין',
    cost: 8000
  },
  {
    id: '3',
    name: 'דלת כניסה ראשית',
    type: 'door',
    position: { x: 5, y: 0, z: 0 },
    rotation: { x: 0, y: 90, z: 0 },
    scale: { x: 1, y: 2.5, z: 0.1 },
    isVisible: true,
    material: 'עץ אלון',
    cost: 5000
  }
]

export default function ARViewer({ 
  projectId, 
  onComponentSelect, 
  onLocationUpdate 
}: ARViewerProps) {
  const [isARActive, setIsARActive] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<ARComponent | null>(null)
  const [components, setComponents] = useState<ARComponent[]>(mockARComponents)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [arMode, setArMode] = useState<'overlay' | 'replace' | 'measure'>('overlay')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(location)
          onLocationUpdate(location)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [onLocationUpdate])

  const startAR = async () => {
    setIsLoading(true)
    
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsARActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('לא ניתן לגשת למצלמה. אנא בדוק הרשאות.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopAR = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsARActive(false)
  }

  const handleComponentToggle = (componentId: string) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, isVisible: !comp.isVisible }
          : comp
      )
    )
  }

  const handleComponentClick = (component: ARComponent) => {
    setSelectedComponent(component)
    onComponentSelect(component)
  }

  const getComponentIcon = (type: ARComponent['type']) => {
    switch (type) {
      case 'wall': return '🧱'
      case 'beam': return '🏗️'
      case 'column': return '🏛️'
      case 'door': return '🚪'
      case 'window': return '🪟'
      default: return '📦'
    }
  }

  const getTypeLabel = (type: ARComponent['type']) => {
    switch (type) {
      case 'wall': return 'קיר'
      case 'beam': return 'קורה'
      case 'column': return 'עמוד'
      case 'door': return 'דלת'
      case 'window': return 'חלון'
      default: return 'רכיב'
    }
  }

  if (!isARActive) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="text-6xl mb-6">📱</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            מצב AR - מציאות רבודה
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            הצג את הפרויקט במציאות רבודה ישירות באתר הבנייה. 
            צפה בתוכניות, מדוד מרחקים ובדוק התאמה למציאות.
          </p>
          
          {currentLocation ? (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">מיקום זוהה בהצלחה</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center space-x-2 text-yellow-700">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">ממתין לזיהוי מיקום...</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={startAR}
              disabled={isLoading || !currentLocation}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="ml-2 h-5 w-5" />
              {isLoading ? 'מתחיל AR...' : 'הפעל מצב AR'}
            </Button>
            
            <div className="text-sm text-gray-500">
              * דרוש גישה למצלמה ולמיקום
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* AR Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ pointerEvents: 'none' }}
        />
      </div>

      {/* AR Components Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {components.filter(comp => comp.isVisible).map(component => (
          <div
            key={component.id}
            className="absolute pointer-events-auto"
            style={{
              left: `${50 + component.position.x * 10}%`,
              top: `${50 + component.position.z * 10}%`,
              transform: `rotateY(${component.rotation.y}deg)`
            }}
          >
            <div
              onClick={() => handleComponentClick(component)}
              className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                selectedComponent?.id === component.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white bg-black/50'
              }`}
            >
              <div className="text-white text-center">
                <div className="text-2xl mb-1">{getComponentIcon(component.type)}</div>
                <div className="text-xs font-medium">{component.name}</div>
                <div className="text-xs opacity-75">{getTypeLabel(component.type)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AR Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setArMode('overlay')}
            className={arMode === 'overlay' ? 'bg-blue-600 text-white' : ''}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setArMode('measure')}
            className={arMode === 'measure' ? 'bg-blue-600 text-white' : ''}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="secondary">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={stopAR}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">רכיבי AR</h4>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="secondary">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            {components.map(component => (
              <button
                key={component.id}
                onClick={() => handleComponentToggle(component.id)}
                className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
                  component.isVisible
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-500 bg-gray-500/20 text-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{getComponentIcon(component.type)}</div>
                  <div className="text-xs">{component.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Component Info Panel */}
      {selectedComponent && (
        <div className="absolute top-20 left-4 w-80 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold">{selectedComponent.name}</h5>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedComponent(null)}
              className="text-white hover:bg-white/20"
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">סוג:</span>
              <span>{getTypeLabel(selectedComponent.type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">חומר:</span>
              <span>{selectedComponent.material}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">עלות:</span>
              <span>₪{selectedComponent.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">מיקום:</span>
              <span>
                {selectedComponent.position.x.toFixed(1)}, 
                {selectedComponent.position.y.toFixed(1)}, 
                {selectedComponent.position.z.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
