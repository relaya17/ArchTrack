export const withTimeout = (ms: number): AbortController => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), ms)
    // @ts-ignore attach for manual clear if needed by callers
    controller.__timeoutId = id
    return controller
}

export const clearAbortTimeout = (controller: AbortController) => {
    // @ts-ignore
    const id = controller.__timeoutId as ReturnType<typeof setTimeout> | undefined
    if (id) clearTimeout(id)
}


