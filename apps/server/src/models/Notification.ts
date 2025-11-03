/**
 * מודל התראה
 * Construction Master App - Notification Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק התראה
export interface INotification extends Document {
    _id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success' | 'project_update' | 'deadline' | 'team_invite' | 'file_upload' | 'ai_response'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    recipient: mongoose.Types.ObjectId
    sender?: mongoose.Types.ObjectId
    projectId?: mongoose.Types.ObjectId
    relatedEntity?: {
        type: 'project' | 'sheet' | 'file' | 'user' | 'ai_chat'
        id: mongoose.Types.ObjectId
    }
    channels: ('email' | 'push' | 'sms' | 'in_app')[]
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
    scheduledAt?: Date
    sentAt?: Date
    readAt?: Date
    metadata?: {
        emailSent?: boolean
        pushSent?: boolean
        smsSent?: boolean
        retryCount?: number
        errorMessage?: string
    }
    isActive: boolean
    createdAt: Date
    updatedAt: Date

    // פונקציות
    markAsRead(): Promise<void>
    markAsSent(): Promise<void>
    isExpired(): boolean
    shouldRetry(): boolean
}

// סכמת התראה
const notificationSchema = new Schema<INotification>({
    title: {
        type: String,
        required: [true, 'כותרת התראה נדרשת'],
        trim: true,
        maxlength: [200, 'כותרת ארוכה מדי']
    },
    message: {
        type: String,
        required: [true, 'תוכן התראה נדרש'],
        trim: true,
        maxlength: [1000, 'תוכן ארוך מדי']
    },
    type: {
        type: String,
        enum: {
            values: ['info', 'warning', 'error', 'success', 'project_update', 'deadline', 'team_invite', 'file_upload', 'ai_response'],
            message: 'סוג התראה לא תקין'
        },
        required: [true, 'סוג התראה נדרש']
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'עדיפות התראה לא תקינה'
        },
        default: 'medium'
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'נמען התראה נדרש']
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ['project', 'sheet', 'file', 'user', 'ai_chat']
        },
        id: {
            type: Schema.Types.ObjectId
        }
    },
    channels: [{
        type: String,
        enum: ['email', 'push', 'sms', 'in_app']
    }],
    status: {
        type: String,
        enum: {
            values: ['pending', 'sent', 'delivered', 'read', 'failed'],
            message: 'סטטוס התראה לא תקין'
        },
        default: 'pending'
    },
    scheduledAt: {
        type: Date
    },
    sentAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    metadata: {
        emailSent: {
            type: Boolean,
            default: false
        },
        pushSent: {
            type: Boolean,
            default: false
        },
        smsSent: {
            type: Boolean,
            default: false
        },
        retryCount: {
            type: Number,
            default: 0
        },
        errorMessage: {
            type: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
notificationSchema.index({ recipient: 1, status: 1 })
notificationSchema.index({ type: 1, priority: 1 })
notificationSchema.index({ scheduledAt: 1 })
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ projectId: 1 })

// Virtual fields
notificationSchema.virtual('isRead').get(function (this: INotification) {
    return !!this.readAt
})

notificationSchema.virtual('isOverdue').get(function (this: INotification) {
    if (!this.scheduledAt) return false
    return this.scheduledAt < new Date() && this.status === 'pending'
})

// פונקציות
notificationSchema.methods.markAsRead = function (): Promise<void> {
    this.readAt = new Date()
    this.status = 'read'
    return this.save()
}

notificationSchema.methods.markAsSent = function (): Promise<void> {
    this.sentAt = new Date()
    this.status = 'sent'
    return this.save()
}

notificationSchema.methods.isExpired = function (): boolean {
    // התראות פגות אחרי 30 יום
    const expiryDate = new Date(this.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000))
    return new Date() > expiryDate
}

notificationSchema.methods.shouldRetry = function (): boolean {
    const maxRetries = 3
    const retryCount = this.metadata?.retryCount || 0
    return retryCount < maxRetries && this.status === 'failed'
}

// Validation
notificationSchema.pre('save', function (next: any) {
    // בדיקת תאריך תזמון
    if (this.scheduledAt && this.scheduledAt < new Date()) {
        next(new Error('תאריך תזמון לא יכול להיות בעבר'))
    }

    // בדיקת ערוצי שליחה
    if (this.channels.length === 0) {
        this.channels = ['in_app'] // ברירת מחדל
    }

    next()
})

// יצירת המודל
const Notification = mongoose.model<INotification>('Notification', notificationSchema)

export default Notification

