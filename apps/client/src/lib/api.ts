/**
 * API Client למערכת הבנייה
 * Construction Master App - API Client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, type AxiosHeaders, type AxiosRequestHeaders, type RawAxiosRequestHeaders } from 'axios'

// הרחבת טיפוסי axios להוספת metadata לבקשות
declare module 'axios' {
    interface AxiosRequestConfig {
        metadata?: { startTime: Date; requestId?: string }
        _retry?: boolean
        _retryCount?: number
        signal?: GenericAbortSignal
        dedupeKey?: string | false
        rateLimitMs?: number
        rateKey?: string
    }
}
import { API_ENDPOINTS } from './constants'
import { ApiResponse, PaginatedResponse, Project, Sheet, File as FileModel, ChatMessage, KPIData } from '../types'
import { errorBus } from './errorBus'

// הגדרות API
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' ? (window as any).ENV?.NEXT_PUBLIC_API_URL : undefined) ||
    'http://localhost:3016'
const API_TIMEOUT = 30000 // 30 שניות

// יצירת instance של axios
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
})

// ניהול ריענון token ותור בקשות ממתינות
type RefreshTokenSubscriber = (token: string | null) => void
let isRefreshingToken = false
let refreshSubscribers: RefreshTokenSubscriber[] = []

const subscribeTokenRefresh = (callback: RefreshTokenSubscriber) => {
    refreshSubscribers.push(callback)
}

const notifyTokenRefreshed = (token: string | null) => {
    refreshSubscribers.forEach((callback) => callback(token))
    refreshSubscribers = []
}

const tryExtractAccessToken = (data: unknown): string | null => {
    if (!data || typeof data !== 'object') return null
    const anyData = data as Record<string, unknown>
    const candidates = [
        anyData['accessToken'],
        anyData['token'],
        (anyData['data'] as Record<string, unknown> | undefined)?.['accessToken'],
        (anyData['data'] as Record<string, unknown> | undefined)?.['token'],
    ]
    const token = candidates.find((v) => typeof v === 'string') as string | undefined
    return token || null
}

const storeAccessToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token)
            // עדכון ברירת מחדל על הלקוח לכל הבקשות הבאות
            ; (apiClient.defaults.headers as unknown as RawAxiosRequestHeaders)['Authorization'] = `Bearer ${token}`
    }
}

// ETag cache + דה-דופליקציה עבור בקשות GET
const etagCache = new Map<string, { etag: string; data: unknown }>()
const inflightGetRequests = new Map<string, Promise<AxiosResponse<any>>>()
const inflightResolvers = new Map<string, (value: AxiosResponse<any>) => void>()
const inflightPostRequests = new Map<string, Promise<AxiosResponse<any>>>()
const rateLimitMap = new Map<string, number>()

const buildCacheKey = (config: AxiosRequestConfig): string => {
    try {
        // משתמשים ב-getUri ליצירת URL סופי עקבי
        const uri = apiClient.getUri(config)
        return `${(config.method || 'get').toUpperCase()}:${uri}`
    } catch {
        return `${(config.method || 'get').toUpperCase()}:${config.url}`
    }
}

const generateRequestId = (): string => {
    try {
        const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) as Crypto | undefined
        // @ts-ignore
        if (cryptoObj?.randomUUID) return (cryptoObj as any).randomUUID()
    } catch { }
    const rnd = Math.random().toString(16).slice(2)
    const ts = Date.now().toString(16)
    return `${ts}-${rnd}`
}

const refreshAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    try {
        const refreshClient = axios.create({
            baseURL: API_BASE_URL,
            timeout: API_TIMEOUT,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        })
        const response = await refreshClient.post(API_ENDPOINTS.auth.refresh)
        const token = tryExtractAccessToken(response.data)
        if (token) {
            storeAccessToken(token)
            return token
        }
        return null
    } catch {
        return null
    }
}

// Interceptor לבקשות
apiClient.interceptors.request.use(
    (config) => {
        // Rate limit אופציונלי לפי rateKey או URL
        const now = Date.now()
        const limitMs = config.rateLimitMs
        if (typeof limitMs === 'number' && limitMs > 0) {
            const rateKey = config.rateKey || `${config.method || 'get'}:${apiClient.getUri(config)}`
            const last = rateLimitMap.get(rateKey) || 0
            if (now - last < limitMs) {
                const remaining = limitMs - (now - last)
                const err = new Error(`Rate limited, retry in ${remaining}ms`)
                    ; (err as any).code = 'ERR_RATE_LIMITED'
                throw err
            }
            rateLimitMap.set(rateKey, now)
        }
        // הוסף token אם קיים
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (token) {
            if (config.headers) {
                const headers = config.headers as AxiosHeaders | RawAxiosRequestHeaders
                if (typeof (headers as AxiosHeaders).set === 'function') {
                    ; (headers as AxiosHeaders).set('Authorization', `Bearer ${token}`)
                } else {
                    ; (headers as RawAxiosRequestHeaders)['Authorization'] = `Bearer ${token}`
                }
            } else {
                config.headers = { Authorization: `Bearer ${token}` } as AxiosRequestHeaders
            }
        }

        // הוסף requestId + timestamp לבקשה
        const requestId = generateRequestId()
        if (config.headers) {
            const headers = config.headers as AxiosHeaders | RawAxiosRequestHeaders
            if (typeof (headers as AxiosHeaders).set === 'function') {
                ; (headers as AxiosHeaders).set('X-Request-Id', requestId)
            } else {
                ; (headers as RawAxiosRequestHeaders)['X-Request-Id'] = requestId
            }
        } else {
            config.headers = { 'X-Request-Id': requestId } as unknown as AxiosRequestHeaders
        }

        // דה-דופליקציה + ETag If-None-Match לבקשות GET
        const method = (config.method || 'get').toLowerCase()
        if (method === 'get') {
            const key = buildCacheKey(config)
            // דה-דופליקציה: אם יש בקשה זהה בתהליך, נשתף את אותה הבטחה
            const inflight = inflightGetRequests.get(key)
            if (inflight) {
                // נשגר חריגה עם ההבטחה כדי להיתפס בהמשך ולקבל את התוצאה
                // זה מונע יצירת בקשה כפולה בפועל
                throw inflight
            }
            // נרשום הבטחה דחויה שתיפתר כאשר תגיע תגובה
            inflightGetRequests.set(
                key,
                new Promise<AxiosResponse<any>>((resolve) => inflightResolvers.set(key, resolve))
            )
            const cached = etagCache.get(key)
            if (cached) {
                const headers = config.headers as AxiosHeaders | RawAxiosRequestHeaders
                if (typeof (headers as AxiosHeaders).set === 'function') {
                    ; (headers as AxiosHeaders).set('If-None-Match', cached.etag)
                } else {
                    ; (headers as RawAxiosRequestHeaders)['If-None-Match'] = cached.etag
                }
            }
        }

        config.metadata = { startTime: new Date(), requestId }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Interceptor לתגובות
apiClient.interceptors.response.use(
    (response) => {
        // חישוב זמן תגובה
        const endTime = new Date()
        const startTimeMs = response.config.metadata?.startTime?.getTime()
        if (startTimeMs) {
            const duration = endTime.getTime() - startTimeMs
            const reqId = response.config.metadata?.requestId
            console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} (${reqId}) took ${duration}ms`)
            if (duration > 3000) {
                errorBus.emit({
                    message: 'הבקשה איטית מהרגיל (מעל 3 שניות)',
                    code: 'SLOW_REQUEST',
                    context: { url: response.config.url, method: response.config.method, duration }
                })
            }
        }

        // אם קיבלנו 304, נחזיר את הנתון מהקאש
        if (response.status === 304) {
            const key = buildCacheKey(response.config)
            const cached = etagCache.get(key)
            if (cached) {
                return { ...response, data: cached.data }
            }
        }

        // שמירת ETag ל-GET
        const method = (response.config.method || 'get').toLowerCase()
        if (method === 'get') {
            const key = buildCacheKey(response.config)
            const resolver = inflightResolvers.get(key)
            if (resolver) {
                resolver(response)
                inflightResolvers.delete(key)
            }
            inflightGetRequests.delete(key)
            const etag = response.headers?.['etag'] || response.headers?.['ETag']
            if (etag) {
                etagCache.set(key, { etag: String(etag), data: response.data })
            }
        }

        // מניעת דה-דופליקציה ומניעת שמירת ETag לבקשות GET
        const key = buildCacheKey(response.config)
        inflightGetRequests.delete(key)

        return response
    },
    (error) => {
        // טיפול בשגיאות + ריענון token אוטומטי
        const status = error?.response?.status as number | undefined
        const originalRequest = error?.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
        const errorCode = (error && typeof error === 'object' && 'code' in error) ? (error as { code?: string }).code : undefined

        // אם הבקשה בוטלה (Abort) אין ריטריי ואין התראות
        if (errorCode === 'ERR_CANCELED') {
            if (originalRequest && (originalRequest.method || '').toLowerCase() === 'get') {
                const key = buildCacheKey(originalRequest)
                inflightGetRequests.delete(key)
                inflightResolvers.delete(key)
            }
            return Promise.reject(error)
        }

        if (status === 401 && typeof window !== 'undefined' && originalRequest) {
            // הימנע מלולאה אינסופית ומבקשת ריענון עצמה
            const isRefreshCall = typeof originalRequest.url === 'string' && originalRequest.url.includes(API_ENDPOINTS.auth.refresh)
            if (isRefreshCall) {
                localStorage.removeItem('auth_token')
                window.location.href = '/login'
                return Promise.reject(error)
            }

            if (!originalRequest._retry) {
                originalRequest._retry = true

                if (isRefreshingToken) {
                    return new Promise((resolve) => {
                        subscribeTokenRefresh((newToken) => {
                            // נסה לשגר את הבקשה מחדש לאחר הריענון
                            if (newToken) {
                                if (!originalRequest.headers) originalRequest.headers = {}
                                const headers = originalRequest.headers as AxiosHeaders | RawAxiosRequestHeaders
                                if (typeof (headers as AxiosHeaders).set === 'function') {
                                    ; (headers as AxiosHeaders).set('Authorization', `Bearer ${newToken}`)
                                } else {
                                    ; (headers as RawAxiosRequestHeaders)['Authorization'] = `Bearer ${newToken}`
                                }
                            }
                            resolve(apiClient(originalRequest))
                        })
                    })
                }

                isRefreshingToken = true
                return refreshAccessToken()
                    .then((newToken) => {
                        isRefreshingToken = false
                        notifyTokenRefreshed(newToken)
                        if (!newToken) {
                            localStorage.removeItem('auth_token')
                            window.location.href = '/login'
                            return Promise.reject(error)
                        }
                        if (!originalRequest.headers) originalRequest.headers = {}
                        const headers = originalRequest.headers as AxiosHeaders | RawAxiosRequestHeaders
                        if (typeof (headers as AxiosHeaders).set === 'function') {
                            ; (headers as AxiosHeaders).set('Authorization', `Bearer ${newToken}`)
                        } else {
                            ; (headers as RawAxiosRequestHeaders)['Authorization'] = `Bearer ${newToken}`
                        }
                        return apiClient(originalRequest)
                    })
                    .catch((err) => {
                        isRefreshingToken = false
                        notifyTokenRefreshed(null)
                        localStorage.removeItem('auth_token')
                        window.location.href = '/login'
                        return Promise.reject(err)
                    })
            }
        }

        // מנגנון retry לבקשות GET עם backoff
        if (originalRequest) {
            const method = (originalRequest.method || '').toLowerCase()
            const isGet = method === 'get'
            const isNetworkOr5xx = !status || (status >= 500 && status < 600)
            if (isGet) {
                const key = buildCacheKey(originalRequest)
                inflightGetRequests.delete(key)
                inflightResolvers.delete(key)
            }
            if (isGet && isNetworkOr5xx) {
                const maxRetries = 3
                originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
                if (originalRequest._retryCount <= maxRetries) {
                    const backoffMs = Math.min(1000 * 2 ** (originalRequest._retryCount - 1), 5000)
                    return new Promise((resolve) => setTimeout(resolve, backoffMs)).then(() => apiClient(originalRequest))
                }
            }
        }

        // פליטה להתראות במקרה של שגיאות קריטיות שאינן ניתנות לשחזור
        if ((status && status >= 500) || !status) {
            errorBus.emit({
                message: 'אירעה שגיאת שרת או רשת. נסו שוב מאוחר יותר.',
                code: status,
                context: {
                    url: originalRequest?.url,
                    method: originalRequest?.method,
                },
            })
        }

        return Promise.reject(error)
    }
)

// פונקציות API בסיסיות
export class ApiClient {
    // GET request
    static async get<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config)
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // POST request
    static async post<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            // דה-דופליקציה ל-POST
            const key = (config?.dedupeKey === false)
                ? undefined
                : (config?.dedupeKey || `${url}|${JSON.stringify(data)}`)
            if (key) {
                const inflight = inflightPostRequests.get(key)
                if (inflight) {
                    const reused = await inflight
                    return reused.data
                }
                const promise = apiClient.post<ApiResponse<T>>(url, data, config)
                inflightPostRequests.set(key, promise)
                try {
                    const response = await promise
                    return response.data
                } finally {
                    inflightPostRequests.delete(key)
                }
            }
            const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config)
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // PUT request
    static async put<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config)
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // PATCH request
    static async patch<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config)
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // DELETE request
    static async delete<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config)
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // Upload file
    static async upload<T = unknown>(
        url: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<T>> {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        onProgress(progress)
                    }
                },
            })

            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // Download file
    static async download(url: string, filename?: string): Promise<void> {
        try {
            const response = await apiClient.get(url, {
                responseType: 'blob',
            })

            const blob = new Blob([response.data])
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename || 'download'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            throw this.handleError(error)
        }
    }

    // טיפול בשגיאות
    private static handleError(error: unknown): Error {
        if (error && typeof error === 'object' && 'response' in error) {
            // שגיאת שרת
            const response = error.response as { data?: { message?: string; error?: string } }
            const message = response.data?.message || response.data?.error || 'שגיאת שרת'
            return new Error(message)
        } else if (error && typeof error === 'object' && 'request' in error) {
            // שגיאת רשת
            return new Error('שגיאת רשת - בדוק את החיבור לאינטרנט')
        } else if (error && typeof error === 'object' && 'message' in error) {
            // שגיאה אחרת
            return new Error((error as { message: string }).message || 'שגיאה לא ידועה')
        } else {
            return new Error('שגיאה לא ידועה')
        }
    }
}

// API functions מותאמות למערכת הבנייה
export const authApi = {
    // התחברות
    login: (email: string, password: string) =>
        ApiClient.post(API_ENDPOINTS.auth.login, { email, password }),

    // התנתקות
    logout: () =>
        ApiClient.post(API_ENDPOINTS.auth.logout),

    // קבלת פרטי משתמש נוכחי
    getCurrentUser: () =>
        ApiClient.get(API_ENDPOINTS.auth.me),

    // רישום משתמש חדש
    register: (userData: { email: string; password: string; name: string }) =>
        ApiClient.post(API_ENDPOINTS.auth.register, userData),

    // רענון token
    refreshToken: () =>
        ApiClient.post(API_ENDPOINTS.auth.refresh),
}

export const projectsApi = {
    // קבלת רשימת פרויקטים
    getProjects: (page = 1, limit = 10) =>
        ApiClient.get<PaginatedResponse<Project>>(`${API_ENDPOINTS.projects.list}?page=${page}&limit=${limit}`),

    // יצירת פרויקט חדש
    createProject: (projectData: { name: string; description?: string; budget?: number }) =>
        ApiClient.post<Project>(API_ENDPOINTS.projects.create, projectData),

    // קבלת פרויקט לפי ID
    getProject: (id: string) =>
        ApiClient.get<Project>(API_ENDPOINTS.projects.get(id)),

    // עדכון פרויקט
    updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'budget' | 'status'>>) =>
        ApiClient.put<Project>(API_ENDPOINTS.projects.update(id), updates),

    // מחיקת פרויקט
    deleteProject: (id: string) =>
        ApiClient.delete(API_ENDPOINTS.projects.delete(id)),
}

export const sheetsApi = {
    // קבלת רשימת גיליונות לפרויקט
    getSheets: (projectId: string) =>
        ApiClient.get<Sheet[]>(API_ENDPOINTS.sheets.list(projectId)),

    // יצירת גיליון חדש
    createSheet: (sheetData: { name: string; projectId: string; description?: string }) =>
        ApiClient.post<Sheet>(API_ENDPOINTS.sheets.create, sheetData),

    // קבלת גיליון לפי ID
    getSheet: (id: string) =>
        ApiClient.get<Sheet>(API_ENDPOINTS.sheets.get(id)),

    // עדכון גיליון
    updateSheet: (id: string, updates: Partial<Pick<Sheet, 'name'> & { description?: string; data?: Record<string, unknown> }>) =>
        ApiClient.put<Sheet>(API_ENDPOINTS.sheets.update(id), updates),

    // מחיקת גיליון
    deleteSheet: (id: string) =>
        ApiClient.delete(API_ENDPOINTS.sheets.delete(id)),

    // ייבוא גיליון
    importSheet: (id: string, file: File) =>
        ApiClient.upload(API_ENDPOINTS.sheets.import(id), file),

    // ייצוא גיליון
    exportSheet: (id: string, format: 'xlsx' | 'pdf' | 'csv') =>
        ApiClient.download(`${API_ENDPOINTS.sheets.export(id)}?format=${format}`),
}

export const cellsApi = {
    // עדכון תא
    updateCell: (sheetId: string, cellData: { row: number; column: number; value: string | number; formula?: string }) =>
        ApiClient.patch(API_ENDPOINTS.cells.update(sheetId), cellData),

    // עדכון תאים מרובים
    updateCells: (sheetId: string, cellsData: { row: number; column: number; value: string | number; formula?: string }[]) =>
        ApiClient.patch(API_ENDPOINTS.cells.batch(sheetId), { cells: cellsData }),
}

export const filesApi = {
    // העלאת קובץ
    uploadFile: (projectId: string, file: File, onProgress?: (progress: number) => void) =>
        ApiClient.upload<FileModel>(API_ENDPOINTS.files.upload(projectId), file, onProgress),

    // קבלת רשימת קבצים
    getFiles: (projectId: string) =>
        ApiClient.get<FileModel[]>(API_ENDPOINTS.files.list(projectId)),

    // קבלת קובץ
    getFile: (id: string) =>
        ApiClient.get<FileModel>(API_ENDPOINTS.files.get(id)),

    // מחיקת קובץ
    deleteFile: (id: string) =>
        ApiClient.delete(API_ENDPOINTS.files.delete(id)),
}

export const chatApi = {
    // קבלת הודעות צ'אט
    getMessages: (projectId: string) =>
        ApiClient.get<ChatMessage[]>(API_ENDPOINTS.chat.messages(projectId)),

    // שליחת הודעה
    sendMessage: (projectId: string, message: { content: string; type?: string; attachments?: string[] }) =>
        ApiClient.post<ChatMessage>(API_ENDPOINTS.chat.send(projectId), message),
}

export const analyticsApi = {
    // קבלת נתוני KPI
    getKPI: (projectId: string) =>
        ApiClient.get<KPIData>(API_ENDPOINTS.analytics.kpi(projectId)),

    // קבלת חיזויים
    getPredictions: (projectId: string) =>
        ApiClient.get<Record<string, unknown>>(API_ENDPOINTS.analytics.predictions(projectId)),

    // קבלת סיכונים
    getRisks: (projectId: string) =>
        ApiClient.get<Record<string, unknown>>(API_ENDPOINTS.analytics.risks(projectId)),
}

// פונקציות עזר
export const apiUtils = {
    // בדיקה אם התגובה הצליחה
    isSuccess: (response: ApiResponse): boolean => {
        return response.success === true
    },

    // קבלת נתונים מתגובה
    getData: <T>(response: ApiResponse<T>): T | undefined => {
        return response.data
    },

    // קבלת שגיאה מתגובה
    getError: (response: ApiResponse): string | undefined => {
        return response.error || response.message
    },

    // יצירת URL עם פרמטרים
    buildUrl: (baseUrl: string, params: Record<string, any>): string => {
        const url = new URL(baseUrl, API_BASE_URL)
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value))
            }
        })
        return url.toString()
    },

    // בדיקת סטטוס קוד
    isStatusOk: (status: number): boolean => {
        return status >= 200 && status < 300
    },

    // בדיקת שגיאת רשת
    isNetworkError: (error: unknown): boolean => {
        return Boolean(error && typeof error === 'object' && !('response' in error) && 'request' in error)
    },

    // בדיקת שגיאת שרת
    isServerError: (error: unknown): boolean => {
        return Boolean(error && typeof error === 'object' && 'response' in error &&
            (error.response as { status: number }).status >= 500)
    },

    // בדיקת שגיאת לקוח
    isClientError: (error: unknown): boolean => {
        return Boolean(error && typeof error === 'object' && 'response' in error &&
            (error.response as { status: number }).status >= 400 &&
            (error.response as { status: number }).status < 500)
    },
}

export default ApiClient
