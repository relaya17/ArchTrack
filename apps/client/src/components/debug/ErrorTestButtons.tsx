'use client'

import React from 'react'
import { errorBus } from '../../lib/errorBus'
import { ApiClient } from '../../lib/api'
import { Button } from '../ui/button'

export default function ErrorTestButtons() {
  const emitToast = () => {
    errorBus.emit({ message: 'שגיאת בדיקה (טוסטר גלובלי)' })
  }

  const triggerApiError = async () => {
    try {
      // בקשה מוחלטת לכתובת שלא זמינה → שגיאת רשת
      await ApiClient.get('http://127.0.0.1:9/__fail__', { baseURL: '' })
    } catch (_e) {
      // מכוון: ה-interceptor יטפל בשגיאה ויפלוט לטוסטר/באנר
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" onClick={emitToast}>
        הדלק טוסטר בדיקה
      </Button>
      <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={triggerApiError}>
        הדמיית שגיאת API
      </Button>
    </div>
  )
}


