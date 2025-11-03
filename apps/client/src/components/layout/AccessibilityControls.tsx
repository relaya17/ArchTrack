'use client'

import React from 'react'
import { Button } from '../ui/button'
import { useAccessibility } from './AccessibilityProvider'
import { 
  Contrast, 
  Type, 
  Eye, 
  Volume2, 
  Settings,
  Minus,
  Plus,
  Monitor
} from 'lucide-react'

/**
 * Accessibility Controls Component
 * Construction Master App - User Accessibility Settings
 * 
 * Provides user interface for accessibility preferences
 */
export default function AccessibilityControls() {
  const {
    isHighContrast,
    isReducedMotion,
    fontSize,
    screenReaderMode,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleScreenReaderMode,
  } = useAccessibility()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">הגדרות נגישות</h3>
      </div>

      <div className="space-y-4">
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Contrast className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">ניגודיות גבוהה</span>
          </div>
          <Button
            onClick={toggleHighContrast}
            variant={isHighContrast ? "default" : "outline"}
            size="sm"
            aria-pressed={isHighContrast}
            aria-label={`${isHighContrast ? 'כבה' : 'הפעל'} ניגודיות גבוהה`}
          >
            {isHighContrast ? 'מופעל' : 'כבוי'}
          </Button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">הפחתת אנימציות</span>
          </div>
          <Button
            onClick={toggleReducedMotion}
            variant={isReducedMotion ? "default" : "outline"}
            size="sm"
            aria-pressed={isReducedMotion}
            aria-label={`${isReducedMotion ? 'כבה' : 'הפעל'} הפחתת אנימציות`}
          >
            {isReducedMotion ? 'מופעל' : 'כבוי'}
          </Button>
        </div>

        {/* Font Size Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">גודל טקסט</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setFontSize('small')}
              variant={fontSize === 'small' ? "default" : "outline"}
              size="sm"
              aria-pressed={fontSize === 'small'}
              aria-label="גודל טקסט קטן"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setFontSize('medium')}
              variant={fontSize === 'medium' ? "default" : "outline"}
              size="sm"
              aria-pressed={fontSize === 'medium'}
              aria-label="גודל טקסט בינוני"
            >
              <Type className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setFontSize('large')}
              variant={fontSize === 'large' ? "default" : "outline"}
              size="sm"
              aria-pressed={fontSize === 'large'}
              aria-label="גודל טקסט גדול"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Screen Reader Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">מצב קורא מסך</span>
          </div>
          <Button
            onClick={toggleScreenReaderMode}
            variant={screenReaderMode ? "default" : "outline"}
            size="sm"
            aria-pressed={screenReaderMode}
            aria-label={`${screenReaderMode ? 'כבה' : 'הפעל'} מצב קורא מסך`}
          >
            {screenReaderMode ? 'מופעל' : 'כבוי'}
          </Button>
        </div>
      </div>

      {/* Accessibility Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Volume2 className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">טיפים לנגישות:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>השתמש ב-Tab לניווט בין אלמנטים</li>
              <li>השתמש ב-Enter או Space להפעלת כפתורים</li>
              <li>השתמש ב-Esc לסגירת חלונות</li>
              <li>השתמש ב-Alt + M לדילוג לתוכן הראשי</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
