'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Filter, 
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  type: 'financial' | 'progress' | 'resource' | 'quality' | 'custom'
  description: string
  parameters: ReportParameter[]
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'dashboard'
  isPublic: boolean
  createdBy: string
  createdAt: Date
  lastUsed?: Date
  usageCount: number
}

interface ReportParameter {
  id: string
  name: string
  type: 'date_range' | 'project' | 'user' | 'category' | 'status' | 'number'
  required: boolean
  defaultValue?: any
  options?: string[]
}

interface ReportData {
  title: string
  data: any[]
  summary: {
    total: number
    average: number
    growth: number
    trends: string[]
  }
  charts: ChartData[]
  tables: TableData[]
}

interface ChartData {
  type: 'bar' | 'line' | 'pie'
  title: string
  data: any[]
  labels: string[]
  colors?: string[]
}

interface TableData {
  title: string
  headers: string[]
  rows: any[][]
  summary?: any[]
}

interface AdvancedReportsProps {
  projectId?: string
  templates?: ReportTemplate[]
  onReportGenerate?: (templateId: string, parameters: any) => Promise<ReportData>
  onTemplateCreate?: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'usageCount'>) => void
  onTemplateUpdate?: (template: ReportTemplate) => void
  onTemplateDelete?: (templateId: string) => void
}

const AdvancedReports: React.FC<AdvancedReportsProps> = ({
  projectId,
  templates = [],
  onReportGenerate,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [filterType, setFilterType] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)

  // Mock templates for demonstration
  const mockTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'דוח התקדמות פרויקט',
      type: 'progress',
      description: 'דוח מפורט על התקדמות הפרויקט לפי משימות וזמנים',
      parameters: [
        { id: 'date_range', name: 'טווח תאריכים', type: 'date_range', required: true },
        { id: 'project', name: 'פרויקט', type: 'project', required: true },
        { id: 'status', name: 'סטטוס משימות', type: 'status', required: false, options: ['כל הסטטוסים', 'הושלם', 'בתהליך', 'מעוכב'] }
      ],
      chartType: 'dashboard',
      isPublic: true,
      createdBy: 'יוסי כהן',
      createdAt: new Date('2024-01-15'),
      usageCount: 25
    },
    {
      id: '2',
      name: 'דוח עלויות ותקציב',
      type: 'financial',
      description: 'ניתוח עלויות, תקציב וסטיות תקציביות',
      parameters: [
        { id: 'date_range', name: 'טווח תאריכים', type: 'date_range', required: true },
        { id: 'project', name: 'פרויקט', type: 'project', required: true },
        { id: 'category', name: 'קטגוריית עלות', type: 'category', required: false, options: ['כל הקטגוריות', 'חומרים', 'עבודה', 'ציוד', 'אחר'] }
      ],
      chartType: 'bar',
      isPublic: true,
      createdBy: 'שרה לוי',
      createdAt: new Date('2024-01-20'),
      usageCount: 18
    },
    {
      id: '3',
      name: 'דוח ניהול משאבים',
      type: 'resource',
      description: 'ניתוח שימוש במשאבים, זמינות ותפוקה',
      parameters: [
        { id: 'date_range', name: 'טווח תאריכים', type: 'date_range', required: true },
        { id: 'resource_type', name: 'סוג משאב', type: 'category', required: false, options: ['כל הסוגים', 'אנשים', 'ציוד', 'חומרים'] }
      ],
      chartType: 'pie',
      isPublic: false,
      createdBy: 'דוד ישראלי',
      createdAt: new Date('2024-01-25'),
      usageCount: 12
    }
  ]

  const displayTemplates = templates.length > 0 ? templates : mockTemplates

  const getTypeIcon = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'financial': return <DollarSign className="h-5 w-5 text-green-500" />
      case 'progress': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'resource': return <Users className="h-5 w-5 text-purple-500" />
      case 'quality': return <CheckCircle className="h-5 w-5 text-orange-500" />
      default: return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeText = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'financial': return 'כספי'
      case 'progress': return 'התקדמות'
      case 'resource': return 'משאבים'
      case 'quality': return 'איכות'
      default: return 'מותאם אישית'
    }
  }

  const getChartTypeText = (type: ReportTemplate['chartType']) => {
    switch (type) {
      case 'bar': return 'עמודות'
      case 'line': return 'קווים'
      case 'pie': return 'עוגה'
      case 'table': return 'טבלה'
      case 'dashboard': return 'לוח בקרה'
      default: return 'לא ידוע'
    }
  }

  const generateReport = async (template: ReportTemplate) => {
    setIsGenerating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock report data
      const mockReportData: ReportData = {
        title: template.name,
        data: [],
        summary: {
          total: 100,
          average: 75,
          growth: 15,
          trends: ['עלייה בהתקדמות', 'שיפור באיכות', 'חיסכון בעלויות']
        },
        charts: [
          {
            type: 'bar',
            title: 'התקדמות לפי חודש',
            data: [65, 78, 85, 92, 88, 95],
            labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני']
          }
        ],
        tables: [
          {
            title: 'סיכום משימות',
            headers: ['משימה', 'סטטוס', 'התקדמות', 'אחראי'],
            rows: [
              ['תכנון אדריכלי', 'הושלם', '100%', 'יוסי כהן'],
              ['אישור רשויות', 'בתהליך', '75%', 'שרה לוי'],
              ['הכנת אתר', 'בתהליך', '30%', 'דוד ישראלי']
            ]
          }
        ]
      }
      
      setReportData(mockReportData)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredTemplates = displayTemplates.filter(template => 
    filterType === 'all' || template.type === filterType
  )

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              דוחות מתקדמים
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                תבנית חדשה
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                הגדרות
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">כל הסוגים</option>
                <option value="financial">כספי</option>
                <option value="progress">התקדמות</option>
                <option value="resource">משאבים</option>
                <option value="quality">איכות</option>
                <option value="custom">מותאם אישית</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(template.type)}
                  <CardTitle className="text-lg ml-2">{template.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {template.isPublic ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{template.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">סוג: {getTypeText(template.type)}</span>
                  <span className="text-gray-500">תרשים: {getChartTypeText(template.chartType)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>נוצר על ידי: {template.createdBy}</span>
                  <span>שימושים: {template.usageCount}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>נוצר: {template.createdAt.toLocaleDateString('he-IL')}</span>
                  {template.lastUsed && (
                    <span>שימוש אחרון: {template.lastUsed.toLocaleDateString('he-IL')}</span>
                  )}
                </div>

                <div className="flex justify-end space-x-1 mt-3">
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      generateReport(template)
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'יוצר...' : 'צור דוח'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Generation Modal */}
      {selectedTemplate && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {getTypeIcon(selectedTemplate.type)}
                <span className="ml-2">{selectedTemplate.name}</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">{selectedTemplate.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.parameters.map((param) => (
                  <div key={param.id}>
                    <label className="block text-sm font-medium mb-1">
                      {param.name} {param.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {param.type === 'date_range' && (
                      <div className="flex space-x-2">
                        <input
                          type="date"
                          className="border rounded px-3 py-1 flex-1"
                          onChange={(e) => setParameters({...parameters, [`${param.id}_start`]: e.target.value})}
                        />
                        <input
                          type="date"
                          className="border rounded px-3 py-1 flex-1"
                          onChange={(e) => setParameters({...parameters, [`${param.id}_end`]: e.target.value})}
                        />
                      </div>
                    )}
                    
                    {param.type === 'project' && (
                      <select
                        className="border rounded px-3 py-1 w-full"
                        onChange={(e) => setParameters({...parameters, [param.id]: e.target.value})}
                      >
                        <option value="">בחר פרויקט</option>
                        <option value="project1">פרויקט 1</option>
                        <option value="project2">פרויקט 2</option>
                      </select>
                    )}
                    
                    {param.type === 'status' && param.options && (
                      <select
                        className="border rounded px-3 py-1 w-full"
                        onChange={(e) => setParameters({...parameters, [param.id]: e.target.value})}
                      >
                        {param.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {param.type === 'number' && (
                      <input
                        type="number"
                        className="border rounded px-3 py-1 w-full"
                        onChange={(e) => setParameters({...parameters, [param.id]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  ביטול
                </Button>
                <Button 
                  onClick={() => generateReport(selectedTemplate)}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'יוצר דוח...' : 'צור דוח'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {reportData && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{reportData.title}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  ייצא
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportData(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.total}</div>
                  <div className="text-sm text-gray-600">סה"כ</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.average}%</div>
                  <div className="text-sm text-gray-600">ממוצע</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{reportData.summary.growth}%</div>
                  <div className="text-sm text-gray-600">צמיחה</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{reportData.summary.trends.length}</div>
                  <div className="text-sm text-gray-600">מגמות</div>
                </div>
              </div>

              {/* Charts */}
              {reportData.charts.map((chart, index) => (
                <div key={index} className="p-4 border rounded">
                  <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
                  <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                    <span className="text-gray-500">תרשים {chart.type} - {chart.data.length} נקודות נתונים</span>
                  </div>
                </div>
              ))}

              {/* Tables */}
              {reportData.tables.map((table, index) => (
                <div key={index} className="p-4 border rounded">
                  <h3 className="text-lg font-semibold mb-4">{table.title}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {table.headers.map((header, i) => (
                            <th key={i} className="px-4 py-2 text-right">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, i) => (
                          <tr key={i} className="border-t">
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-2">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvancedReports
