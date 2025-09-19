'use client'

import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

interface KPIData {
  budget: number
  spent: number
  progress: number
  daysRemaining: number
}

interface KPICardsProps {
  data: KPIData
}

export default function KPICards({ data }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const remaining = data.budget - data.spent
  const isOverBudget = remaining < 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* תקציב כולל */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">תקציב כולל</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.budget)}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* הוצאות עד היום */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">הוצאות עד היום</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.spent)}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* התקדמות */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">התקדמות</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.progress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(data.progress, 100)}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* ימים נותרים */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">ימים נותרים</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.daysRemaining}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
