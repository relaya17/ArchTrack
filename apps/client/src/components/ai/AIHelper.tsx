'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bot, 
  Send, 
  Lightbulb, 
  Calculator, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'

interface AIResponse {
  type: 'formula' | 'suggestion' | 'warning' | 'optimization'
  title: string
  content: string
  confidence: number
  action?: string
}

interface AIHelperProps {
  onFormulaSuggest: (formula: string) => void
  onOptimizationSuggest: (suggestion: string) => void
  currentCell?: string
  currentValue?: string
}

const mockAIResponses: AIResponse[] = [
  {
    type: 'formula',
    title: 'הצעת נוסחה חכמה',
    content: 'לחישוב עלות כוללת של בטון, השתמש בנוסחה: =QUANTITY * UNIT_PRICE * (1 + WASTE_PERCENTAGE)',
    confidence: 95,
    action: 'החל נוסחה'
  },
  {
    type: 'optimization',
    title: 'המלצה לחיסכון',
    content: 'ניתן לחסוך 15% בעלות הבטון על ידי הזמנה בכמויות גדולות יותר',
    confidence: 87,
    action: 'הצג חלופות'
  },
  {
    type: 'warning',
    title: 'אזהרת תקציב',
    content: 'העלות הנוכחית עולה על התקציב המתוכנן ב-12%',
    confidence: 92,
    action: 'בדוק תקציב'
  }
]

export default function AIHelper({ 
  onFormulaSuggest, 
  onOptimizationSuggest, 
  currentCell,
  currentValue 
}: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    
    // Simulate AI processing
    setTimeout(() => {
      const newResponse: AIResponse = {
        type: 'suggestion',
        title: 'תגובת AI',
        content: `תבסס על השאלה "${query}", אני ממליץ לבדוק את הנוסחאות הקיימות ולעדכן את הערכים בהתאם לתקנים החדשים.`,
        confidence: 88
      }
      
      setResponses(prev => [newResponse, ...prev])
      setQuery('')
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getResponseIcon = (type: AIResponse['type']) => {
    switch (type) {
      case 'formula': return <Calculator className="h-5 w-5 text-blue-600" />
      case 'optimization': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default: return <Lightbulb className="h-5 w-5 text-purple-600" />
    }
  }

  const getResponseColor = (type: AIResponse['type']) => {
    switch (type) {
      case 'formula': return 'border-blue-200 bg-blue-50'
      case 'optimization': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const handleAction = (response: AIResponse) => {
    if (response.type === 'formula') {
      onFormulaSuggest(response.content)
    } else if (response.type === 'optimization') {
      onOptimizationSuggest(response.content)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg z-50"
        size="lg"
      >
        <Bot className="ml-2 h-5 w-5" />
        AI Helper
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Helper</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Context */}
      {currentCell && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">תא נוכחי:</span> {currentCell}
          </p>
          {currentValue && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">ערך:</span> {currentValue}
            </p>
          )}
        </div>
      )}

      {/* AI Responses */}
      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {responses.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              שאל אותי על נוסחאות, חיסכון בעלויות או אופטימיזציה
            </p>
          </div>
        )}

        {responses.map((response, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getResponseColor(response.type)}`}
          >
            <div className="flex items-start space-x-2">
              {getResponseIcon(response.type)}
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {response.title}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {response.content}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    ביטחון: {response.confidence}%
                  </span>
                  {response.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(response)}
                      className="h-6 px-2 text-xs"
                    >
                      {response.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="mr-2 text-sm text-gray-600">AI חושב...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שאל על נוסחאות, חיסכון או אופטימיזציה..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
