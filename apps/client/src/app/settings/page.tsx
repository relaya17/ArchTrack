'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  Settings, 
  Save,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Download,
  Upload
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    profile: {
      name: 'יוסי כהן',
      email: 'yossi@example.com',
      phone: '050-1234567',
      company: 'חברת בנייה כהן בע"מ',
      position: 'מנהל פרויקטים'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      projectUpdates: true,
      budgetAlerts: true,
      deadlineReminders: true
    },
    appearance: {
      theme: 'light',
      language: 'he',
      fontSize: 'medium'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    }
  })

  const tabs = [
    { id: 'profile', label: 'פרופיל', icon: User },
    { id: 'notifications', label: 'התראות', icon: Bell },
    { id: 'appearance', label: 'מראה', icon: Palette },
    { id: 'security', label: 'אבטחה', icon: Shield },
    { id: 'data', label: 'נתונים', icon: Database },
  ]

  const handleSave = () => {
    console.log('Saving settings:', settings)
    // Handle save logic
  }

  const handleExport = () => {
    console.log('Exporting data')
    // Handle export logic
  }

  const handleImport = () => {
    console.log('Importing data')
    // Handle import logic
  }

  return (
    <LayoutWithSidebar>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">הגדרות</h1>
          <p className="text-gray-600">ניהול הגדרות המערכת והחשבון</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-right transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="ml-3 h-5 w-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">פרטי פרופיל</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value }
                        }))}
                        title="שם מלא"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value }
                        }))}
                        title="אימייל"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                      <input
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value }
                        }))}
                        title="טלפון"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">חברה</label>
                      <input
                        type="text"
                        value={settings.profile.company}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, company: e.target.value }
                        }))}
                        title="חברה"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">תפקיד</label>
                      <input
                        type="text"
                        value={settings.profile.position}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, position: e.target.value }
                        }))}
                        title="תפקיד"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">הגדרות התראות</h2>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {key === 'emailNotifications' && 'התראות אימייל'}
                            {key === 'pushNotifications' && 'התראות דחיפה'}
                            {key === 'projectUpdates' && 'עדכוני פרויקט'}
                            {key === 'budgetAlerts' && 'התראות תקציב'}
                            {key === 'deadlineReminders' && 'תזכורות מועדים'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {key === 'emailNotifications' && 'קבל התראות בדוא"ל'}
                            {key === 'pushNotifications' && 'קבל התראות בדפדפן'}
                            {key === 'projectUpdates' && 'עדכונים על שינויים בפרויקט'}
                            {key === 'budgetAlerts' && 'התראות על חריגות תקציב'}
                            {key === 'deadlineReminders' && 'תזכורות על מועדי יעד'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: e.target.checked }
                            }))}
                            title={`${key === 'emailNotifications' && 'התראות אימייל' || key === 'pushNotifications' && 'התראות דחיפה' || key === 'projectUpdates' && 'עדכוני פרויקט' || key === 'budgetAlerts' && 'התראות תקציב' || key === 'deadlineReminders' && 'תזכורות מועדים'}`}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">הגדרות מראה</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ערכת נושא</label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, theme: e.target.value }
                        }))}
                        title="ערכת נושא"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">בהיר</option>
                        <option value="dark">כהה</option>
                        <option value="auto">אוטומטי</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">שפה</label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, language: e.target.value }
                        }))}
                        title="שפה"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="he">עברית</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">גודל גופן</label>
                      <select
                        value={settings.appearance.fontSize}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, fontSize: e.target.value }
                        }))}
                        title="גודל גופן"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="small">קטן</option>
                        <option value="medium">בינוני</option>
                        <option value="large">גדול</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">הגדרות אבטחה</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">אימות דו-שלבי</h3>
                        <p className="text-sm text-gray-600">הוסף שכבת אבטחה נוספת לחשבון</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, twoFactorAuth: e.target.checked }
                          }))}
                          title="אימות דו-שלבי"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">פסק זמן לסשן (דקות)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                        }))}
                        title="פסק זמן לסשן"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">תפוגת סיסמה (ימים)</label>
                      <input
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, passwordExpiry: parseInt(e.target.value) }
                        }))}
                        title="תפוגת סיסמה"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">ניהול נתונים</h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">ייצוא נתונים</h3>
                      <p className="text-sm text-gray-600 mb-4">הורד עותק של כל הנתונים שלך</p>
                      <Button onClick={handleExport} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        ייצא נתונים
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">ייבוא נתונים</h3>
                      <p className="text-sm text-gray-600 mb-4">העלה קובץ נתונים למערכת</p>
                      <Button onClick={handleImport} variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        ייבא נתונים
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  שמור הגדרות
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
