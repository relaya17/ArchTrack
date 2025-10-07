'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '../../components/ui/button'
import { 
  Undo, 
  Redo,
  Trash2, 
  Save, 
  Share, 
  Grid, 
  Grid3X3,
  Pencil,
  Minus,
  Square,
  Circle,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  Copy,
  Clipboard,
  Download,
  Upload,
  Camera,
  Settings,
  Ruler,
  Eraser,
  Paintbrush,
  Type,
  Image,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Palette,
  Droplets,
  MousePointer,
  Hand,
  Maximize,
  Minimize,
  Scan,
  Zap,
  Target,
  RotateCcw,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface Shape {
  id: string
  type: 'line' | 'rectangle' | 'circle' | 'freehand' | 'furniture' | 'text' | 'image' | 'eraser'
  startPoint: Point
  endPoint: Point
  color: string
  strokeWidth: number
  points?: Point[]
  furnitureType?: string
  image?: string
  text?: string
  fontSize?: number
  fontFamily?: string
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  layer?: number
  isLocked?: boolean
  isVisible?: boolean
  rotation?: number
  scale?: number
  opacity?: number
  fillColor?: string
  strokeDashArray?: string
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
}

const furnitureItems = [
  { type: 'sofa', name: 'ספה', image: '🛋️', size: { width: 80, height: 40 } },
  { type: 'bed', name: 'מיטה', image: '🛏️', size: { width: 60, height: 80 } },
  { type: 'table', name: 'שולחן', image: '🪑', size: { width: 50, height: 50 } },
  { type: 'chair', name: 'כיסא', image: '🪑', size: { width: 30, height: 30 } },
  { type: 'wardrobe', name: 'ארון', image: '🚪', size: { width: 40, height: 80 } },
  { type: 'tv', name: 'טלוויזיה', image: '📺', size: { width: 50, height: 30 } },
  { type: 'refrigerator', name: 'מקרר', image: '🧊', size: { width: 40, height: 60 } },
  { type: 'stove', name: 'כיריים', image: '🔥', size: { width: 50, height: 30 } },
  { type: 'sink', name: 'כיור', image: '🚰', size: { width: 40, height: 30 } },
  { type: 'toilet', name: 'שירותים', image: '🚽', size: { width: 30, height: 40 } },
  { type: 'bathtub', name: 'אמבטיה', image: '🛁', size: { width: 60, height: 40 } },
  { type: 'shower', name: 'מקלחת', image: '🚿', size: { width: 40, height: 40 } },
  { type: 'window', name: 'חלון', image: '🪟', size: { width: 60, height: 20 } },
  { type: 'door', name: 'דלת', image: '🚪', size: { width: 20, height: 60 } },
  { type: 'plant', name: 'עציץ', image: '🪴', size: { width: 20, height: 20 } },
  { type: 'lamp', name: 'מנורה', image: '💡', size: { width: 15, height: 15 } },
  { type: 'bookshelf', name: 'מדף ספרים', image: '📚', size: { width: 40, height: 60 } },
  { type: 'desk', name: 'שולחן עבודה', image: '🖥️', size: { width: 60, height: 40 } },
]

export default function DrawingPage() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [currentShape, setCurrentShape] = useState<Shape | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [drawingTool, setDrawingTool] = useState('freehand')
  const [showGrid, setShowGrid] = useState(true)
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [selectedShapes, setSelectedShapes] = useState<string[]>([])
  const [history, setHistory] = useState<Shape[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [layers, setLayers] = useState<{id: number, name: string, visible: boolean, locked: boolean}[]>([
    {id: 1, name: 'שכבה 1', visible: true, locked: false}
  ])
  const [activeLayer, setActiveLayer] = useState(1)
  const [showRuler, setShowRuler] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [strokeDashArray, setStrokeDashArray] = useState('')
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowBlur, setShadowBlur] = useState(5)
  const [shadowOffsetX, setShadowOffsetX] = useState(2)
  const [shadowOffsetY, setShadowOffsetY] = useState(2)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [detectedObjects, setDetectedObjects] = useState<{
    type: string
    name: string
    confidence: number
    x: number
    y: number
    width: number
    height: number
  }[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasElementRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const startPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    
    if (selectedFurniture) {
      const furniture = furnitureItems.find(item => item.type === selectedFurniture)
      if (furniture) {
        const newShape: Shape = {
          id: Date.now().toString(),
          type: 'furniture',
          startPoint,
          endPoint: startPoint,
          color: strokeColor,
          strokeWidth,
          furnitureType: furniture.type,
          image: furniture.image
        }
        
        setShapes(prev => [...prev, newShape])
        return
      }
    }
    
    const newShape: Shape = {
      id: Date.now().toString(),
      type: drawingTool as Shape['type'],
      startPoint,
      endPoint: startPoint,
      color: strokeColor,
      strokeWidth,
      points: drawingTool === 'freehand' ? [startPoint] : undefined
    }
    
    setCurrentShape(newShape)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentShape || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    
    if (drawingTool === 'freehand') {
      setCurrentShape(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), currentPoint]
      } : null)
    } else {
      setCurrentShape(prev => prev ? {
        ...prev,
        endPoint: currentPoint
      } : null)
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      setShapes(prev => [...prev, currentShape])
      setCurrentShape(null)
      setIsDrawing(false)
    }
  }

  const clearCanvas = () => {
    setShapes([])
    setCurrentShape(null)
  }

  // History Management
  const saveToHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newShapes])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setShapes([...history[historyIndex - 1]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setShapes([...history[historyIndex + 1]])
    }
  }

  // Zoom and Pan
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)))
  }

  const handlePan = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))
    }
  }

  // Selection and Manipulation
  const selectShape = (shapeId: string) => {
    setSelectedShapes(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    )
  }

  const deleteSelected = () => {
    setShapes(prev => prev.filter(shape => !selectedShapes.includes(shape.id)))
    setSelectedShapes([])
    saveToHistory(shapes.filter(shape => !selectedShapes.includes(shape.id)))
  }

  const copySelected = () => {
    const selected = shapes.filter(shape => selectedShapes.includes(shape.id))
    navigator.clipboard.writeText(JSON.stringify(selected))
  }

  const pasteShapes = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const pastedShapes = JSON.parse(text)
      const newShapes = pastedShapes.map((shape: Shape) => ({
        ...shape,
        id: Date.now().toString() + Math.random(),
        startPoint: { x: shape.startPoint.x + 20, y: shape.startPoint.y + 20 },
        endPoint: { x: shape.endPoint.x + 20, y: shape.endPoint.y + 20 }
      }))
      setShapes(prev => [...prev, ...newShapes])
      saveToHistory([...shapes, ...newShapes])
    } catch (error) {
      console.error('Failed to paste:', error)
    }
  }

  // Layer Management
  const addLayer = () => {
    const newLayer = {
      id: Math.max(...layers.map(l => l.id)) + 1,
      name: `שכבה ${layers.length + 1}`,
      visible: true,
      locked: false
    }
    setLayers(prev => [...prev, newLayer])
  }

  const toggleLayerVisibility = (layerId: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ))
  }

  const toggleLayerLock = (layerId: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ))
  }

  // Text Tool
  const addText = (point: Point) => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type: 'text',
      startPoint: point,
      endPoint: point,
      color: strokeColor,
      strokeWidth: 0,
      text: textInput || 'טקסט',
      fontSize,
      fontFamily,
      isBold,
      isItalic,
      isUnderline,
      layer: activeLayer,
      isLocked: false,
      isVisible: true,
      rotation: 0,
      scale: 1,
      opacity,
      fillColor: 'transparent'
    }
    setShapes(prev => [...prev, newShape])
    saveToHistory([...shapes, newShape])
  }

  // Export Functions
  const exportAsPNG = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 1920
    canvas.height = 1080
    
    // Draw background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw shapes
    shapes.forEach(shape => {
      if (shape.type === 'freehand' && shape.points) {
        ctx.beginPath()
        ctx.moveTo(shape.points[0].x, shape.points[0].y)
        shape.points.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y)
        })
        ctx.strokeStyle = shape.color
        ctx.lineWidth = shape.strokeWidth
        ctx.stroke()
      }
    })
    
    const link = document.createElement('a')
    link.download = 'drawing.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const exportAsSVG = () => {
    const svg = `
      <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        ${shapes.map(shape => {
          if (shape.type === 'freehand' && shape.points) {
            const path = shape.points.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ')
            return `<path d="${path}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" fill="none"/>`
          }
          return ''
        }).join('')}
      </svg>
    `
    
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'drawing.svg'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  // Camera and Image Processing Functions
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraOpen(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('לא ניתן לגשת למצלמה. אנא בדוק הרשאות.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasElementRef.current) {
      const canvas = canvasElementRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        
        if (aiMode) {
          processImageWithAI(imageData)
        }
        
        closeCamera()
      }
    }
  }

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
  }

  const uploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        
        if (aiMode) {
          processImageWithAI(imageData)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const processImageWithAI = async (imageData: string) => {
    setIsProcessing(true)
    
    try {
      // Simulate AI processing (in real app, call actual AI service)
      await new Promise<void>(resolve => setTimeout(resolve, 2000))
      
      // Mock detected objects
      const mockObjects = [
        { type: 'sofa', name: 'ספה', confidence: 0.95, x: 100, y: 200, width: 200, height: 100 },
        { type: 'table', name: 'שולחן', confidence: 0.87, x: 300, y: 300, width: 150, height: 150 },
        { type: 'chair', name: 'כיסא', confidence: 0.82, x: 500, y: 250, width: 80, height: 120 },
        { type: 'window', name: 'חלון', confidence: 0.91, x: 50, y: 50, width: 200, height: 100 }
      ]
      
      setDetectedObjects(mockObjects)
      
      // Auto-add detected objects to canvas
      mockObjects.forEach(obj => {
        const furniture = furnitureItems.find(item => item.type === obj.type)
        if (furniture) {
          const newShape: Shape = {
            id: Date.now().toString() + Math.random(),
            type: 'furniture',
            startPoint: { x: obj.x, y: obj.y },
            endPoint: { x: obj.x, y: obj.y },
            color: strokeColor,
            strokeWidth: 2,
            furnitureType: furniture.type,
            image: furniture.image,
            layer: activeLayer,
            isLocked: false,
            isVisible: true,
            rotation: 0,
            scale: 1,
            opacity: 0.8
          }
          setShapes(prev => [...prev, newShape])
        }
      })
      
    } catch (error) {
      console.error('AI processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resizeImage = (imageData: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) return
        
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = imageData
    })
  }

  const addImageToCanvas = async (imageData: string) => {
    const resizedImage = await resizeImage(imageData, 400, 300)
    
    const newShape: Shape = {
      id: Date.now().toString(),
      type: 'image',
      startPoint: { x: 100, y: 100 },
      endPoint: { x: 500, y: 400 },
      color: '#000000',
      strokeWidth: 0,
      image: resizedImage,
      layer: activeLayer,
      isLocked: false,
      isVisible: true,
      rotation: 0,
      scale: 1,
      opacity: 1
    }
    
    setShapes(prev => [...prev, newShape])
    saveToHistory([...shapes, newShape])
  }

  const renderShape = (shape: Shape) => {
    switch (shape.type) {
      case 'line':
        const lineLength = Math.sqrt(
          Math.pow(shape.endPoint.x - shape.startPoint.x, 2) + 
          Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
        )
        const lineAngle = Math.atan2(
          shape.endPoint.y - shape.startPoint.y, 
          shape.endPoint.x - shape.startPoint.x
        )
        
        return (
          <div
            key={shape.id}
            className="absolute"
            style={{
              left: shape.startPoint.x,
              top: shape.startPoint.y,
              width: lineLength,
              height: shape.strokeWidth,
              backgroundColor: shape.color,
              transformOrigin: '0 50%',
              transform: `rotate(${lineAngle}rad)`,
            }}
          />
        )
      
      case 'rectangle':
        return (
          <div
            key={shape.id}
            className="absolute border-2"
            style={{
              left: Math.min(shape.startPoint.x, shape.endPoint.x),
              top: Math.min(shape.startPoint.y, shape.endPoint.y),
              width: Math.abs(shape.endPoint.x - shape.startPoint.x),
              height: Math.abs(shape.endPoint.y - shape.startPoint.y),
              borderColor: shape.color,
              borderWidth: shape.strokeWidth,
            }}
          />
        )
      
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(shape.endPoint.x - shape.startPoint.x, 2) + 
          Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
        )
        return (
          <div
            key={shape.id}
            className="absolute border-2 rounded-full"
            style={{
              left: shape.startPoint.x - radius,
              top: shape.startPoint.y - radius,
              width: radius * 2,
              height: radius * 2,
              borderColor: shape.color,
              borderWidth: shape.strokeWidth,
            }}
          />
        )
      
      case 'freehand':
        if (!shape.points || shape.points.length < 2) return null
        return (
          <svg key={shape.id} className="absolute inset-0 pointer-events-none">
            <path
              d={`M ${shape.points[0].x} ${shape.points[0].y} ${shape.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      
      case 'furniture':
        const furniture = furnitureItems.find(item => item.type === shape.furnitureType)
        if (!furniture) return null
        
        return (
          <div
            key={shape.id}
            className="absolute flex items-center justify-center border-2 border-gray-400 bg-white/80 rounded cursor-move"
            style={{
              left: shape.startPoint.x - furniture.size.width / 2,
              top: shape.startPoint.y - furniture.size.height / 2,
              width: furniture.size.width,
              height: furniture.size.height,
            }}
          >
            <span className="text-2xl">{furniture.image}</span>
          </div>
        )
      
      case 'image':
        return (
          <div
            key={shape.id}
            className="absolute border-2 border-gray-400 bg-white rounded cursor-move"
            style={{
              left: Math.min(shape.startPoint.x, shape.endPoint.x),
              top: Math.min(shape.startPoint.y, shape.endPoint.y),
              width: Math.abs(shape.endPoint.x - shape.startPoint.x),
              height: Math.abs(shape.endPoint.y - shape.startPoint.y),
              opacity: shape.opacity || 1,
              transform: `rotate(${shape.rotation || 0}deg) scale(${shape.scale || 1})`,
            }}
          >
            <img
              src={shape.image}
              alt="Uploaded"
              className="w-full h-full object-cover rounded"
              draggable={false}
            />
          </div>
        )
      
      case 'text':
        return (
          <div
            key={shape.id}
            className="absolute cursor-move"
            style={{
              left: shape.startPoint.x,
              top: shape.startPoint.y,
              color: shape.color,
              fontSize: shape.fontSize || 16,
              fontFamily: shape.fontFamily || 'Arial',
              fontWeight: shape.isBold ? 'bold' : 'normal',
              fontStyle: shape.isItalic ? 'italic' : 'normal',
              textDecoration: shape.isUnderline ? 'underline' : 'none',
              opacity: shape.opacity || 1,
              transform: `rotate(${shape.rotation || 0}deg) scale(${shape.scale || 1})`,
            }}
          >
            {shape.text}
          </div>
        )
      
      default:
        return null
    }
  }

  const renderGrid = () => {
    if (!showGrid) return null
    
    const gridSize = 20
    const gridLines = []
    
    for (let i = 0; i < 1000; i += gridSize) {
      gridLines.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-300 opacity-30"
          style={{
            left: i,
            top: 0,
            width: 1,
            height: '100%',
          }}
        />
      )
    }
    
    for (let i = 0; i < 1000; i += gridSize) {
      gridLines.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-300 opacity-30"
          style={{
            top: i,
            left: 0,
            height: 1,
            width: '100%',
          }}
        />
      )
    }
    
    return <div className="absolute inset-0 pointer-events-none">{gridLines}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">מערכת תכנון אדריכלי</h1>
            <div className="flex flex-wrap items-center gap-1 lg:gap-2">
              {/* History */}
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex items-center text-xs lg:text-sm"
              >
                <Undo className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">ביטול</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center text-xs lg:text-sm"
              >
                <Redo className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">חזרה</span>
              </Button>
              
              {/* Selection Tools */}
              <Button
                variant="outline"
                size="sm"
                onClick={copySelected}
                disabled={selectedShapes.length === 0}
                className="flex items-center text-xs lg:text-sm"
              >
                <Copy className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">העתק</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pasteShapes}
                className="flex items-center text-xs lg:text-sm"
              >
                <Clipboard className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">הדבק</span>
              </Button>
              
              {/* Zoom */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(0.1)}
                className="flex items-center text-xs lg:text-sm"
              >
                <ZoomIn className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(-0.1)}
                className="flex items-center text-xs lg:text-sm"
              >
                <ZoomOut className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
              
              {/* Grid & Ruler */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className="flex items-center text-xs lg:text-sm"
              >
                {showGrid ? <Grid3X3 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" /> : <Grid className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />}
                <span className="hidden sm:inline">רשת</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRuler(!showRuler)}
                className="flex items-center text-xs lg:text-sm"
              >
                <Ruler className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">סרגל</span>
              </Button>
              
              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsPNG}
                className="flex items-center text-xs lg:text-sm"
              >
                <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">PNG</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsSVG}
                className="flex items-center text-xs lg:text-sm"
              >
                <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">SVG</span>
              </Button>
              
              {/* Clear */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span className="hidden sm:inline">נקה הכל</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Tools Sidebar */}
        <div className="w-full lg:w-64 bg-white shadow-sm border-r lg:border-b-0 border-b max-h-96 lg:max-h-none overflow-y-auto">
          <div className="p-2 lg:p-4">
            <h3 className="text-sm lg:text-lg font-semibold mb-2 lg:mb-4">כלי תכנון</h3>
            
            {/* Drawing Tools */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-1 lg:gap-2 mb-3 lg:mb-6">
              <Button
                variant={drawingTool === 'freehand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('freehand')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Pencil className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">יד חופשית</span>
              </Button>
              <Button
                variant={drawingTool === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('line')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Minus className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">קו</span>
              </Button>
              <Button
                variant={drawingTool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('rectangle')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Square className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">מלבן</span>
              </Button>
              <Button
                variant={drawingTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('circle')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Circle className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">עיגול</span>
              </Button>
              <Button
                variant={drawingTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('text')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Type className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">טקסט</span>
              </Button>
              <Button
                variant={drawingTool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('eraser')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Eraser className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">מחק</span>
              </Button>
              <Button
                variant={drawingTool === 'move' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDrawingTool('move')
                  setSelectedFurniture(null)
                }}
                className="w-full justify-center lg:justify-start text-xs lg:text-sm"
              >
                <Move className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">הזז</span>
              </Button>
            </div>

            {/* Camera & AI Tools */}
            <div className="mb-3 lg:mb-6">
              <h4 className="text-xs lg:text-sm font-medium mb-1 lg:mb-2">צילום ועיבוד AI</h4>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 lg:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCamera}
                  className="w-full justify-center lg:justify-start text-xs lg:text-sm"
                >
                  <Camera className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">צלם חדר</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-center lg:justify-start text-xs lg:text-sm"
                >
                  <Upload className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">העלה תמונה</span>
                </Button>
                <Button
                  variant={aiMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiMode(!aiMode)}
                  className="w-full justify-center lg:justify-start text-xs lg:text-sm"
                >
                  <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">מצב AI</span>
                </Button>
                {capturedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addImageToCanvas(capturedImage)}
                    className="w-full justify-center lg:justify-start text-xs lg:text-sm"
                  >
                    <Image className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">הוסףאנבס</span>
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadImage}
                className="hidden"
                title="העלה תמונה"
                aria-label="העלה תמונה"
              />
            </div>

            {/* Furniture Library */}
            <div className="mb-3 lg:mb-6">
              <h4 className="text-xs lg:text-sm font-medium mb-1 lg:mb-2">ריהוט ופריטים</h4>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-1 lg:gap-2 max-h-32 lg:max-h-48 overflow-y-auto">
                {furnitureItems.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      setSelectedFurniture(item.type)
                      setDrawingTool('furniture')
                    }}
                    className={`p-1 lg:p-2 border rounded text-center hover:bg-gray-100 ${
                      selectedFurniture === item.type ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
                    }`}
                    title={item.name}
                    aria-label={item.name}
                  >
                    <div className="text-sm lg:text-lg mb-1">{item.image}</div>
                    <div className="text-xs text-gray-600 hidden lg:block">{item.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mb-3 lg:mb-6">
              <h4 className="text-xs lg:text-sm font-medium mb-1 lg:mb-2">צבעים</h4>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-1 lg:gap-2">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`w-8 h-8 rounded border-2 ${
                      strokeColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`בחר צבע ${color}`}
                    aria-label={`בחר צבע ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">עובי קו</h4>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {[1, 3, 5, 8].map((width) => (
                  <Button
                    key={width}
                    variant={strokeWidth === width ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStrokeWidth(width)}
                    className="w-full"
                  >
                    {width}px
                  </Button>
                ))}
              </div>
            </div>

            {/* Layers Panel */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">שכבות</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLayer}
                  className="p-1"
                >
                  <Layers className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {layers.map((layer) => (
                  <div key={layer.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="p-1"
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleLayerLock(layer.id)}
                      className="p-1"
                    >
                      {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs flex-1 ${activeLayer === layer.id ? 'font-bold' : ''}`}>
                      {layer.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Settings */}
            {drawingTool === 'text' && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">הגדרות טקסט</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="הקלד טקסט..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    title="הקלד טקסט"
                  />
                  <div className="flex space-x-1">
                    <Button
                      variant={isBold ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsBold(!isBold)}
                      className="p-1"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={isItalic ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsItalic(!isItalic)}
                      className="p-1"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={isUnderline ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsUnderline(!isUnderline)}
                      className="p-1"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    title="גודל גופן"
                  >
                    <option value={12}>12px</option>
                    <option value={16}>16px</option>
                    <option value={20}>20px</option>
                    <option value={24}>24px</option>
                    <option value={32}>32px</option>
                    <option value={48}>48px</option>
                  </select>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">הגדרות מתקדמות</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">שקיפות</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-16"
                    title="שקיפות"
                    aria-label="שקיפות"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">גודל רשת</span>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="px-2 py-1 border rounded text-xs"
                    title="גודל רשת"
                  >
                    <option value={10}>10px</option>
                    <option value={20}>20px</option>
                    <option value={50}>50px</option>
                    <option value={100}>100px</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="snapToGrid"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  <label htmlFor="snapToGrid" className="text-xs">הצמד לרשת</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="shadowEnabled"
                    checked={shadowEnabled}
                    onChange={(e) => setShadowEnabled(e.target.checked)}
                  />
                  <label htmlFor="shadowEnabled" className="text-xs">צל</label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Save')}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                שמור
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Share')}
                className="w-full"
              >
                <Share className="w-4 h-4 mr-2" />
                שתף
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Advanced Tools */}
        <div className="hidden xl:block w-48 bg-gray-50 border-l shadow-sm">
          <div className="p-3">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">כלים מתקדמים</h4>
            
            {/* Quick Actions */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">פעולות מהירות</h5>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(1)}
                  className="w-full justify-start text-xs"
                >
                  <Target className="w-3 h-3 mr-2" />
                  מרכז
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(0.5)}
                  className="w-full justify-start text-xs"
                >
                  <Minimize className="w-3 h-3 mr-2" />
                  הקטן
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(2)}
                  className="w-full justify-start text-xs"
                >
                  <Maximize className="w-3 h-3 mr-2" />
                  הגדל
                </Button>
              </div>
            </div>

            {/* Transform Tools */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">טרנספורמציה</h5>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Rotate')}
                  className="w-full justify-start text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  סובב
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Flip H')}
                  className="w-full justify-start text-xs"
                >
                  <FlipHorizontal className="w-3 h-3 mr-2" />
                  היפוך אופקי
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Flip V')}
                  className="w-full justify-start text-xs"
                >
                  <FlipVertical className="w-3 h-3 mr-2" />
                  היפוך אנכי
                </Button>
              </div>
            </div>

            {/* Alignment Tools */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">יישור</h5>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Align Left')}
                  className="text-xs p-1"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Align Center')}
                  className="text-xs p-1"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Align Right')}
                  className="text-xs p-1"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Align Justify')}
                  className="text-xs p-1"
                >
                  <AlignJustify className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">שכבות</h5>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveLayer(activeLayer + 1)}
                  className="w-full justify-start text-xs"
                >
                  <Layers className="w-3 h-3 mr-2" />
                  שכבה למעלה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveLayer(Math.max(1, activeLayer - 1))}
                  className="w-full justify-start text-xs"
                >
                  <Layers className="w-3 h-3 mr-2" />
                  שכבה למטה
                </Button>
              </div>
            </div>

            {/* View Controls */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">תצוגה</h5>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">רשת</span>
                  <button
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      showGrid ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    title="הצג/הסתר רשת"
                    aria-label="הצג/הסתר רשת"
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      showGrid ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">סרגל</span>
                  <button
                    type="button"
                    onClick={() => setShowRuler(!showRuler)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      showRuler ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    title="הצג/הסתר סרגל"
                    aria-label="הצג/הסתר סרגל"
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      showRuler ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">הצמדה</span>
                  <button
                    type="button"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      snapToGrid ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    title="הצמד/בטל הצמדה לרשת"
                    aria-label="הצמד/בטל הצמדה לרשת"
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      snapToGrid ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Zoom Level Display */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">רמת זום</h5>
              <div className="bg-white border rounded p-2 text-center">
                <span className="text-sm font-mono">{(zoom * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Canvas Info */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-600">מידעאנבס</h5>
              <div className="bg-white border rounded p-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>צורות:</span>
                  <span className="font-mono">{shapes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>שכבה:</span>
                  <span className="font-mono">{activeLayer}</span>
                </div>
                <div className="flex justify-between">
                  <span>כלים:</span>
                  <span className="font-mono">{layers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-white">
          {/* Top Ruler */}
          {showRuler && (
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 border-b flex items-center text-xs text-gray-600 z-10">
              <div className="flex w-full">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="flex-1 text-center border-r border-gray-300">
                    {i * 50}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Left Ruler */}
          {showRuler && (
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-gray-100 border-r flex flex-col items-center text-xs text-gray-600 z-10">
              <div className="flex flex-col h-full">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="flex-1 text-center border-b border-gray-300 flex items-center justify-center">
                    {i * 50}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            ref={canvasRef}
            className={`w-full h-full relative cursor-crosshair ${showRuler ? 'mt-6 ml-6' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {renderGrid()}
            {shapes.map(shape => renderShape(shape))}
            {currentShape && renderShape(currentShape)}
          </div>
          
          {/* Hidden canvas for image processing */}
          <canvas
            ref={canvasElementRef}
            className="hidden"
          />
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">צלם חדר או מוצר</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCamera}
              >
                ✕
              </Button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-96 object-cover rounded"
              />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                  <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>מעבד תמונה עם AI...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4 mt-4">
              <Button
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                צלם
              </Button>
              <Button
                variant="outline"
                onClick={closeCamera}
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Processing Results */}
      {detectedObjects.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-40">
          <h4 className="font-semibold mb-2">אובייקטים שזוהו:</h4>
          <div className="space-y-1">
            {detectedObjects.map((obj, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{obj.name}</span>
                <span className="text-gray-500">{(obj.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetectedObjects([])}
            className="w-full mt-2"
          >
            סגור
          </Button>
        </div>
      )}
    </div>
  )
}
