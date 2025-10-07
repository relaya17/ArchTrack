import { useEffect } from 'react'
import { errorBus, type ErrorEvent } from '../lib/errorBus'

type Options = {
    notify?: (event: ErrorEvent) => void
}

export const useErrorAlerts = (options?: Options) => {
    useEffect(() => {
        const unsubscribe = errorBus.subscribe((event) => {
            if (options?.notify) options.notify(event)
        })
        return unsubscribe
    }, [options])
}

export default useErrorAlerts


