'use client'

import React, { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { ApiClient } from '../../lib/api'
import { withTimeout, clearAbortTimeout } from '../../lib/abort'

export default function AbortDemo() {
  const controllerRef = useRef<AbortController | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string>('')

  const start = async () => {
    if (running) return
    setResult('')
    setRunning(true)
    const ctrl = withTimeout(1500)
    controllerRef.current = ctrl
    try {
      await ApiClient.get('/__slow_endpoint__', { signal: ctrl.signal as any })
      setResult('הושלם')
    } catch (e: any) {
      setResult(e?.message || 'בוטל/נכשל')
    } finally {
      setRunning(false)
      clearAbortTimeout(ctrl)
      controllerRef.current = null
    }
  }

  const cancel = () => {
    controllerRef.current?.abort()
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={start} disabled={running}>
        התחל בקשה (מוגבלת 1.5ש׳)
      </Button>
      <Button type="button" variant="outline" onClick={cancel} disabled={!running}>
        בטל
      </Button>
      {result && <span className="text-sm text-gray-600">{result}</span>}
    </div>
  )
}


