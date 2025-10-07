'use client'

import React, { useState, useEffect } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react'

interface Reminder {
  id: string
  title: string
  description: string
  date: string
  time: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  description: string
  type: 'meeting' | 'task' | 'reminder' | 'personal'
}

export default function SelfManagementPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 // Adjust for Sunday

  // Generate calendar days
  const calendarDays: Array<number | null> = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get reminders for a specific date
  const getRemindersForDate = (date: string) => {
    return reminders.filter(reminder => reminder.date === date)
  }

  // Get events for a specific date
  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date)
  }

  // Handle date selection
  const handleDateClick = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateString)
    setNewReminder(prev => ({ ...prev, date: dateString }))
  }

  // Add new reminder
  const addReminder = () => {
    if (newReminder.title && newReminder.date) {
      const reminder: Reminder = {
        id: Date.now().toString(),
        title: newReminder.title,
        description: newReminder.description,
        date: newReminder.date,
        time: newReminder.time,
        completed: false,
        priority: newReminder.priority,
        createdAt: new Date()
      }
      setReminders(prev => [...prev, reminder])
      setNewReminder({
        title: '',
        description: '',
        date: '',
        time: '',
        priority: 'medium'
      })
      setShowAddModal(false)
    }
  }

  // Edit reminder
  const editReminder = () => {
    if (editingReminder && newReminder.title && newReminder.date) {
      setReminders(prev => prev.map(reminder => 
        reminder.id === editingReminder.id 
          ? { ...reminder, ...newReminder }
          : reminder
      ))
      setEditingReminder(null)
      setNewReminder({
        title: '',
        description: '',
        date: '',
        time: '',
        priority: 'medium'
      })
      setShowAddModal(false)
    }
  }

  // Delete reminder
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id))
  }

  // Toggle reminder completion
  const toggleReminderCompletion = (id: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    ))
  }

  // Start editing reminder
  const startEditingReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setNewReminder({
      title: reminder.title,
      description: reminder.description,
      date: reminder.date,
      time: reminder.time,
      priority: reminder.priority
    })
    setShowAddModal(true)
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Check if date has reminders or events
  const hasRemindersOrEvents = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayReminders = getRemindersForDate(dateString)
    const dayEvents = getEventsForDate(dateString)
    return dayReminders.length > 0 || dayEvents.length > 0
  }

  // Get today's date string
  const getTodayString = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  return (
    <LayoutWithSidebar>
      <div className="h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול עצמי</h1>
            <p className="text-gray-600">לוח שנה אישי עם תזכורות ומשימות</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      title="חודש קודם"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {monthNames[currentMonth]} {currentYear}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      title="חודש הבא"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    title="היום"
                  >
                    היום
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['ב', 'ג', 'ד', 'ה', 'ו', 'ש', 'א'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="h-16"></div>
                    }

                    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isToday = dateString === getTodayString()
                    const isSelected = selectedDate === dateString
                    const hasEvents = hasRemindersOrEvents(day)

                    return (
                      <div
                        key={day}
                        className={`
                          h-16 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                          ${isToday ? 'bg-blue-100 border-blue-300' : ''}
                          ${isSelected ? 'bg-blue-200 border-blue-400' : ''}
                          ${hasEvents ? 'bg-yellow-50 border-yellow-200' : ''}
                        `}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="p-2 h-full flex flex-col">
                          <div className={`
                            text-sm font-medium
                            ${isToday ? 'text-blue-600' : 'text-gray-900'}
                            ${isSelected ? 'text-blue-800' : ''}
                          `}>
                            {day}
                          </div>
                          {hasEvents && (
                            <div className="flex-1 flex items-end">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Add Reminder Button */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setEditingReminder(null)
                    setNewReminder({
                      title: '',
                      description: '',
                      date: selectedDate || getTodayString(),
                      time: '',
                      priority: 'medium'
                    })
                    setShowAddModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף תזכורת
                </Button>
              </div>

              {/* Today's Reminders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  תזכורות להיום
                </h3>
                <div className="space-y-3">
                  {getRemindersForDate(getTodayString()).map(reminder => (
                    <div
                      key={reminder.id}
                      className={`
                        p-3 rounded-lg border
                        ${reminder.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => toggleReminderCompletion(reminder.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {reminder.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span className={`
                              text-sm font-medium
                              ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'}
                            `}>
                              {reminder.title}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-xs text-gray-600 mb-2">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            {reminder.time && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {reminder.time}
                              </span>
                            )}
                            <span className={`
                              text-xs px-2 py-1 rounded-full border
                              ${getPriorityColor(reminder.priority)}
                            `}>
                              {reminder.priority === 'high' ? 'גבוהה' : 
                               reminder.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => startEditingReminder(reminder)}
                            className="text-gray-400 hover:text-blue-600"
                            title="ערוך"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getRemindersForDate(getTodayString()).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      אין תזכורות להיום
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Date Info */}
              {selectedDate && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {new Date(selectedDate).toLocaleDateString('he-IL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-3">
                    {getRemindersForDate(selectedDate).map(reminder => (
                      <div key={reminder.id} className="p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">{reminder.title}</span>
                        </div>
                        {reminder.time && (
                          <p className="text-xs text-gray-600 mt-1">{reminder.time}</p>
                        )}
                      </div>
                    ))}
                    {getRemindersForDate(selectedDate).length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-2">
                        אין תזכורות לתאריך זה
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Reminder Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingReminder ? 'ערוך תזכורת' : 'הוסף תזכורת'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כותרת
                  </label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="הזן כותרת לתזכורת"
                    title="כותרת התזכורת"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור
                  </label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="הזן תיאור (אופציונלי)"
                    title="תיאור התזכורת"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך
                    </label>
                    <input
                      type="date"
                      value={newReminder.date}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="תאריך התזכורת"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שעה
                    </label>
                    <input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="שעת התזכורת"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עדיפות
                  </label>
                  <select
                    value={newReminder.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewReminder(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="עדיפות התזכורת"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  ביטול
                </Button>
                <Button
                  onClick={editingReminder ? editReminder : addReminder}
                  disabled={!newReminder.title || !newReminder.date}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingReminder ? 'עדכן' : 'שמור'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  )
}
