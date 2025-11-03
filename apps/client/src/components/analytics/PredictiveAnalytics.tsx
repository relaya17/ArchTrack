'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Clock,
  Target
} from 'lucide-react'

interface PredictionData {
  type: 'cost' | 'schedule' | 'risk' | 'resource'
  title: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  impact: 'high' | 'medium' | 'low'
  recommendation: string
}

interface RiskFactor {
  id: string
  name: string
  probability: number
  impact: number
  mitigation: string
  status: 'active' | 'monitored' | 'resolved'
}

const mockPredictions: PredictionData[] = [
  {
    type: 'cost',
    title: 'עלות כוללת של הפרויקט',
    current: 1200000,
    predicted: 1350000,
    confidence: 87,
    trend: 'up',
    impact: 'high',
    recommendation: 'המלצה: צמצם עלויות חומרים על ידי הזמנה מוקדמת'
  },
  {
    type: 'schedule',
    title: 'זמן השלמה צפוי',
    current: 180,
    predicted: 195,
    confidence: 92,
    trend: 'up',
    impact: 'medium',
    recommendation: 'המלצה: הוסף משאבים לשלב הבנייה הקריטי'
  },
  {
    type: 'resource',
    title: 'צריכת בטון חודשית',
    current: 45,
    predicted: 52,
    confidence: 78,
    trend: 'up',
    impact: 'medium',
    recommendation: 'המלצה: הזמן בטון נוסף למחסן'
  }
]

const mockRisks: RiskFactor[] = [
  {
    id: '1',
    name: 'עיכוב באספקת חומרים',
    probability: 75,
    impact: 8,
    mitigation: 'הזמנה מוקדמת עם ספקים חלופיים',
    status: 'active'
  },
  {
    id: '2',
    name: 'עליית מחירי פלדה',
    probability: 60,
    impact: 6,
    mitigation: 'הסכם מחיר קבוע עם הספק',
    status: 'monitored'
  },
  {
    id: '3',
    name: 'מזג אוויר קיצוני',
    probability: 30,
    impact: 4,
    mitigation: 'תכנון חלופי לפעילות פנימית',
    status: 'monitored'
  }
]

export default function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'risks' | 'optimization'>('predictions')
  const [predictions, setPredictions] = useState<PredictionData[]>(mockPredictions)
  const [risks, setRisks] = useState<RiskFactor[]>(mockRisks)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTrendIcon = (trend: PredictionData['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getImpactColor = (impact: PredictionData['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
    }
  }

  const getRiskStatusColor = (status: RiskFactor['status']) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'monitored': return 'text-yellow-600 bg-yellow-100'
      case 'resolved': return 'text-green-600 bg-green-100'
    }
  }

  const calculateRiskScore = (risk: RiskFactor) => {
    return (risk.probability * risk.impact) / 10
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="ml-2 h-6 w-6 text-blue-600" />
              ניתוח חיזוי מתקדם
            </h2>
            <p className="text-gray-600 mt-1">
              ניתוח נתונים וניבוי מגמות עתידיות בפרויקט
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="ml-2 h-4 w-4" />
              עדכן נתונים
            </Button>
            <Button size="sm">
              <Target className="ml-2 h-4 w-4" />
              יצור דוח
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'predictions', label: 'חיזויים', icon: TrendingUp },
            { id: 'risks', label: 'ניהול סיכונים', icon: AlertTriangle },
            { id: 'optimization', label: 'אופטימיזציה', icon: CheckCircle }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="ml-2 h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {predictions.map((prediction, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{prediction.title}</h3>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(prediction.trend)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(prediction.impact)}`}>
                        {prediction.impact === 'high' ? 'גבוה' : prediction.impact === 'medium' ? 'בינוני' : 'נמוך'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">ערך נוכחי</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {prediction.type === 'cost' ? formatCurrency(prediction.current) : 
                         prediction.type === 'schedule' ? `${prediction.current} ימים` :
                         `${prediction.current} יחידות`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">חיזוי</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {prediction.type === 'cost' ? formatCurrency(prediction.predicted) : 
                         prediction.type === 'schedule' ? `${prediction.predicted} ימים` :
                         `${prediction.predicted} יחידות`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">רמת ביטחון</span>
                      <span className="text-sm font-medium text-gray-900">{prediction.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{prediction.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {risks.map(risk => (
                <div key={risk.id} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{risk.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskStatusColor(risk.status)}`}>
                      {risk.status === 'active' ? 'פעיל' : risk.status === 'monitored' ? 'מנוטר' : 'נפתר'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">הסתברות</span>
                        <span className="text-sm font-medium text-gray-900">{risk.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${risk.probability}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">השפעה</span>
                        <span className="text-sm font-medium text-gray-900">{risk.impact}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(risk.impact / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-gray-100 rounded">
                      <span className="text-sm font-medium text-gray-900">
                        ציון סיכון: {calculateRiskScore(risk).toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>הפחתת סיכון:</strong> {risk.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <CheckCircle className="ml-2 h-5 w-5" />
                  הזדמנויות חיסכון
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-gray-900">הזמנה מוקדמת של בטון</p>
                    <p className="text-sm text-gray-600">חיסכון צפוי: ₪25,000</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-gray-900">אופטימיזציה של לוח זמנים</p>
                    <p className="text-sm text-gray-600">חיסכון צפוי: 15 ימים</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Target className="ml-2 h-5 w-5" />
                  המלצות אופטימיזציה
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-gray-900">שיפור יעילות צוות</p>
                    <p className="text-sm text-gray-600">הגדלת תפוקה ב-20%</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-gray-900">ניהול מלאי חכם</p>
                    <p className="text-sm text-gray-600">הפחתת בזבוז ב-30%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
