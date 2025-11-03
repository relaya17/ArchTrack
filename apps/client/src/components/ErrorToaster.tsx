'use client'

import React, { useEffect, useState } from 'react'
import { errorBus, type ErrorEvent } from '../lib/errorBus'

type Toast = { id: string; message: string }

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export default function ErrorToaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = errorBus.subscribe((event: ErrorEvent) => {
      setToasts((prev) => [...prev, { id: genId(), message: event.message }])
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 5000))
    return () => { timers.forEach(clearTimeout) }
  }, [toasts])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} role="alert" className="toast">
          <span>{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="סגור" className="toast-close">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}


