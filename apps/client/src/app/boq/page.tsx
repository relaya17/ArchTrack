'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  Calculator, 
  Plus,
  Edit,
  Trash2,
  Save,
  FileText,
  BarChart3
} from 'lucide-react'

export default function BOQPage() {
  const [activeTab, setActiveTab] = useState('items')
  
  const boqItems = [
    { id: 1, code: '001', description: 'חפירת יסודות', unit: 'מק"מ', quantity: 150, rate: 45, amount: 6750 },
    { id: 2, code: '002', description: 'יציקת בטון יסודות', unit: 'מק"מ', quantity: 25, rate: 1200, amount: 30000 },
    { id: 3, code: '003', description: 'בניית קירות', unit: 'מק"ר', quantity: 200, rate: 180, amount: 36000 },
    { id: 4, code: '004', description: 'התקנת חלונות', unit: 'יחידה', quantity: 12, rate: 800, amount: 9600 },
  ]

  const totalAmount = boqItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <LayoutWithSidebar>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BOQ - Bill of Quantities</h1>
          <p className="text-gray-600">ניהול גיליון כמויות מפורט לפרויקט</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">פריטים</p>
                <p className="text-2xl font-bold text-gray-900">{boqItems.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">סך הכל</p>
                <p className="text-2xl font-bold text-gray-900">₪{totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ממוצע פריט</p>
                <p className="text-2xl font-bold text-gray-900">₪{(totalAmount / boqItems.length).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">סטטוס</p>
                <p className="text-2xl font-bold text-green-600">פעיל</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'items' ? 'default' : 'outline'}
                onClick={() => setActiveTab('items')}
              >
                פריטי BOQ
              </Button>
              <Button 
                variant={activeTab === 'summary' ? 'default' : 'outline'}
                onClick={() => setActiveTab('summary')}
              >
                סיכום
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                שמור
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                הוסף פריט
              </Button>
            </div>
          </div>
        </div>

        {/* BOQ Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">קוד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תיאור</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">יחידה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מחיר יחידה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סכום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₪{item.rate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₪{item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    סה"כ:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₪{totalAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
