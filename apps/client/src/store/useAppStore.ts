/**
 * Store מרכזי למערכת הבנייה
 * משתמש ב-Zustand לניהול state גלובלי
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, Project, Sheet, GridCell, ChatMessage, KPIData } from '../types'

// State interface
interface AppState {
    // משתמש נוכחי
    currentUser: User | null
    isAuthenticated: boolean

    // פרויקטים
    projects: Project[]
    currentProject: Project | null

    // גיליונות
    sheets: Sheet[]
    currentSheet: Sheet | null

    // תאים בגריד
    gridCells: GridCell[]
    selectedCell: string | null

    // צ'אט
    chatMessages: ChatMessage[]

    // KPI נתונים
    kpiData: KPIData | null

    // הגדרות UI
    sidebarCollapsed: boolean
    theme: 'light' | 'dark'
    language: 'he' | 'en'

    // טעינה
    isLoading: boolean
    error: string | null
}

// Actions interface
interface AppActions {
    // משתמש
    setCurrentUser: (user: User | null) => void
    setAuthenticated: (isAuth: boolean) => void

    // פרויקטים
    setProjects: (projects: Project[]) => void
    setCurrentProject: (project: Project | null) => void
    addProject: (project: Project) => void
    updateProject: (id: string, updates: Partial<Project>) => void
    deleteProject: (id: string) => void

    // גיליונות
    setSheets: (sheets: Sheet[]) => void
    setCurrentSheet: (sheet: Sheet | null) => void
    addSheet: (sheet: Sheet) => void
    updateSheet: (id: string, updates: Partial<Sheet>) => void
    deleteSheet: (id: string) => void

    // תאים
    setGridCells: (cells: GridCell[]) => void
    setSelectedCell: (cellId: string | null) => void
    updateCell: (cellId: string, updates: Partial<GridCell>) => void
    addCell: (cell: GridCell) => void
    deleteCell: (cellId: string) => void

    // צ'אט
    setChatMessages: (messages: ChatMessage[]) => void
    addChatMessage: (message: ChatMessage) => void

    // KPI
    setKPIData: (data: KPIData) => void

    // UI
    toggleSidebar: () => void
    setTheme: (theme: 'light' | 'dark') => void
    setLanguage: (language: 'he' | 'en') => void

    // טעינה ושגיאות
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void

    // ניקוי
    reset: () => void
}

// Initial state
const initialState: AppState = {
    currentUser: null,
    isAuthenticated: false,
    projects: [],
    currentProject: null,
    sheets: [],
    currentSheet: null,
    gridCells: [],
    selectedCell: null,
    chatMessages: [],
    kpiData: null,
    sidebarCollapsed: false,
    theme: 'light',
    language: 'he',
    isLoading: false,
    error: null,
}

// Store creation
export const useAppStore = create<AppState & AppActions>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // משתמש
                setCurrentUser: (user) => set({ currentUser: user }),
                setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),

                // פרויקטים
                setProjects: (projects) => set({ projects }),
                setCurrentProject: (project) => set({ currentProject: project }),
                addProject: (project) => set((state) => ({
                    projects: [...state.projects, project]
                })),
                updateProject: (id, updates) => set((state) => ({
                    projects: state.projects.map(p =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                    currentProject: state.currentProject?.id === id
                        ? { ...state.currentProject, ...updates }
                        : state.currentProject
                })),
                deleteProject: (id) => set((state) => ({
                    projects: state.projects.filter(p => p.id !== id),
                    currentProject: state.currentProject?.id === id ? null : state.currentProject
                })),

                // גיליונות
                setSheets: (sheets) => set({ sheets }),
                setCurrentSheet: (sheet) => set({ currentSheet: sheet }),
                addSheet: (sheet) => set((state) => ({
                    sheets: [...state.sheets, sheet]
                })),
                updateSheet: (id, updates) => set((state) => ({
                    sheets: state.sheets.map(s =>
                        s.id === id ? { ...s, ...updates } : s
                    ),
                    currentSheet: state.currentSheet?.id === id
                        ? { ...state.currentSheet, ...updates }
                        : state.currentSheet
                })),
                deleteSheet: (id) => set((state) => ({
                    sheets: state.sheets.filter(s => s.id !== id),
                    currentSheet: state.currentSheet?.id === id ? null : state.currentSheet
                })),

                // תאים
                setGridCells: (cells) => set({ gridCells: cells }),
                setSelectedCell: (cellId) => set({ selectedCell: cellId }),
                updateCell: (cellId, updates) => set((state) => ({
                    gridCells: state.gridCells.map(c =>
                        c.id === cellId ? { ...c, ...updates } : c
                    )
                })),
                addCell: (cell) => set((state) => ({
                    gridCells: [...state.gridCells, cell]
                })),
                deleteCell: (cellId) => set((state) => ({
                    gridCells: state.gridCells.filter(c => c.id !== cellId),
                    selectedCell: state.selectedCell === cellId ? null : state.selectedCell
                })),

                // צ'אט
                setChatMessages: (messages) => set({ chatMessages: messages }),
                addChatMessage: (message) => set((state) => ({
                    chatMessages: [...state.chatMessages, message]
                })),

                // KPI
                setKPIData: (data) => set({ kpiData: data }),

                // UI
                toggleSidebar: () => set((state) => ({
                    sidebarCollapsed: !state.sidebarCollapsed
                })),
                setTheme: (theme) => set({ theme }),
                setLanguage: (language) => set({ language }),

                // טעינה ושגיאות
                setLoading: (loading) => set({ isLoading: loading }),
                setError: (error) => set({ error }),

                // ניקוי
                reset: () => set(initialState),
            }),
            {
                name: 'construction-app-storage',
                partialize: (state) => ({
                    currentUser: state.currentUser,
                    isAuthenticated: state.isAuthenticated,
                    currentProject: state.currentProject,
                    currentSheet: state.currentSheet,
                    theme: state.theme,
                    language: state.language,
                    sidebarCollapsed: state.sidebarCollapsed,
                }),
            }
        ),
        {
            name: 'construction-app-store',
        }
    )
)

// Selectors מותאמים
export const useCurrentUser = () => useAppStore((state) => state.currentUser)
export const useCurrentProject = () => useAppStore((state) => state.currentProject)
export const useCurrentSheet = () => useAppStore((state) => state.currentSheet)
export const useSelectedCell = () => useAppStore((state) => state.selectedCell)
export const useKPIData = () => useAppStore((state) => state.kpiData)
export const useTheme = () => useAppStore((state) => state.theme)
export const useLanguage = () => useAppStore((state) => state.language)
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed)
export const useIsLoading = () => useAppStore((state) => state.isLoading)
export const useError = () => useAppStore((state) => state.error)
