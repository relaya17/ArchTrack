'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download
} from 'lucide-react'

interface GanttTask {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  dependencies: string[]
  assignee: string
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  description?: string
}

interface GanttChartProps {
  projectId: string
  tasks?: GanttTask[]
  onTaskUpdate?: (task: GanttTask) => void
  onTaskCreate?: (task: Omit<GanttTask, 'id'>) => void
  onTaskDelete?: (taskId: string) => void
}

const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  tasks = [],
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete
}) => {
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const ganttRef = useRef<HTMLDivElement>(null)

  // Mock data for demonstration
  const mockTasks: GanttTask[] = [
    {
      id: '1',
      name: 'תכנון אדריכלי',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      progress: 100,
      dependencies: [],
      assignee: 'יוסי כהן',
      status: 'completed',
      priority: 'high'
    },
    {
      id: '2',
      name: 'אישור רשויות',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-02-15'),
      progress: 75,
      dependencies: ['1'],
      assignee: 'שרה לוי',
      status: 'in_progress',
      priority: 'critical'
    },
    {
      id: '3',
      name: 'הכנת אתר',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-28'),
      progress: 30,
      dependencies: ['2'],
      assignee: 'דוד ישראלי',
      status: 'in_progress',
      priority: 'high'
    },
    {
      id: '4',
      name: 'בנייה',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      progress: 0,
      dependencies: ['3'],
      assignee: 'קבוצת בנייה',
      status: 'not_started',
      priority: 'critical'
    }
  ]

  const displayTasks = tasks.length > 0 ? tasks : mockTasks

  const getStatusColor = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'delayed': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: GanttTask['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500'
      case 'high': return 'border-l-orange-500'
      case 'medium': return 'border-l-yellow-500'
      default: return 'border-l-gray-300'
    }
  }

  const calculateTaskPosition = (task: GanttTask) => {
    const start = new Date(task.startDate)
    const end = new Date(task.endDate)
    const now = new Date()
    const projectStart = new Date('2024-01-01')
    
    const startOffset = Math.max(0, (start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    
    return {
      left: `${startOffset * 2}px`,
      width: `${duration * 2}px`
    }
  }

  const filteredTasks = displayTasks.filter(task => 
    filterStatus === 'all' || task.status === filterStatus
  )

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              לוח זמנים - Gantt Chart
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                משימה חדשה
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ייצא
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">כל המשימות</option>
                <option value="not_started">לא התחיל</option>
                <option value="in_progress">בתהליך</option>
                <option value="completed">הושלם</option>
                <option value="delayed">מעוכב</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                יום
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                שבוע
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                חודש
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-6 mb-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              הושלם
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              בתהליך
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              מעוכב
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
              לא התחיל
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Timeline Header */}
              <div className="sticky top-0 bg-gray-50 border-b">
                <div className="flex">
                  <div className="w-64 p-4 border-r bg-gray-100 font-semibold">
                    משימה
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ינואר 2024</span>
                      <span>פברואר</span>
                      <span>מרץ</span>
                      <span>אפריל</span>
                      <span>מאי</span>
                      <span>יוני</span>
                      <span>יולי</span>
                      <span>אוגוסט</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {filteredTasks.map((task) => {
                  const position = calculateTaskPosition(task)
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(task.priority)}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="w-64 p-4 border-r">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-gray-600">{task.assignee}</div>
                      </div>
                      <div className="flex-1 relative h-12">
                        <div
                          className={`absolute top-2 h-8 rounded ${getStatusColor(task.status)} opacity-80`}
                          style={{
                            left: position.left,
                            width: position.width
                          }}
                        >
                          <div className="flex items-center h-full px-2 text-white text-xs">
                            <span className="truncate">{task.name}</span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div
                          className={`absolute top-2 h-8 rounded ${getStatusColor(task.status)}`}
                          style={{
                            left: position.left,
                            width: `${(parseInt(position.width) * task.progress / 100)}px`
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      {selectedTask && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedTask.name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">מתחיל</label>
                <p>{selectedTask.startDate.toLocaleDateString('he-IL')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">מסתיים</label>
                <p>{selectedTask.endDate.toLocaleDateString('he-IL')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">התקדמות</label>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                  <span className="text-sm">{selectedTask.progress}%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">סטטוס</label>
                <p className="capitalize">{selectedTask.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">אחראי</label>
                <p>{selectedTask.assignee}</p>
              </div>
              <div>
                <label className="text-sm font-medium">עדיפות</label>
                <p className="capitalize">{selectedTask.priority}</p>
              </div>
            </div>
            
            {selectedTask.description && (
              <div className="mt-4">
                <label className="text-sm font-medium">תיאור</label>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                ערוך
              </Button>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                מחק
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GanttChart
