export type ErrorEvent = {
    message: string
    code?: string | number
    context?: Record<string, unknown>
}

type ErrorListener = (event: ErrorEvent) => void

class ErrorBus {
    private listeners: Set<ErrorListener> = new Set()

    subscribe(listener: ErrorListener): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    emit(event: ErrorEvent) {
        this.listeners.forEach((l) => l(event))
    }
}

export const errorBus = new ErrorBus()


