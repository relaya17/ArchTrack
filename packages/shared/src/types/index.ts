// Shared types for Construction Excel Pro

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'engineer' | 'contractor';
    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    startDate: Date;
    endDate?: Date;
    budget: number;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Sheet {
    id: string;
    projectId: string;
    name: string;
    type: 'boq' | 'materials' | 'schedule' | 'costs';
    data: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface File {
    id: string;
    projectId: string;
    name: string;
    type: 'drawing' | 'document' | 'image' | 'pdf';
    url: string;
    size: number;
    uploadedBy: string;
    createdAt: Date;
}

export interface ChatMessage {
    id: string;
    projectId: string;
    userId: string;
    content: string;
    type: 'text' | 'file' | 'system';
    createdAt: Date;
}
