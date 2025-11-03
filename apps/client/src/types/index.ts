// Types for Construction Master App

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

export interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'manager' | 'engineer' | 'contractor'
    createdAt: Date
    updatedAt: Date
}

export interface Project {
    id: string
    name: string
    description: string
    status: 'planning' | 'active' | 'completed' | 'on-hold'
    startDate: Date
    endDate?: Date
    budget: number
    ownerId: string
    createdAt: Date
    updatedAt: Date
}

export interface Sheet {
    id: string
    projectId: string
    name: string
    type: 'boq' | 'materials' | 'schedule' | 'costs'
    data: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
}

export interface File {
    id: string
    projectId: string
    name: string
    type: 'drawing' | 'document' | 'image' | 'pdf'
    url: string
    size: number
    uploadedBy: string
    createdAt: Date
}

export interface GridCell {
    id: string
    sheetId: string
    row: number
    column: number
    value: string | number
    formula?: string
    type: 'text' | 'number' | 'formula' | 'date'
    style?: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
}

export interface ChatMessage {
    id: string
    projectId: string
    userId: string
    content: string
    type: 'text' | 'file' | 'system'
    createdAt: Date
}

export interface KPIData {
    projectId: string
    totalCost: number
    budgetUsed: number
    progress: number
    risks: number
    timeline: number;
    updatedAt: Date;
} 
