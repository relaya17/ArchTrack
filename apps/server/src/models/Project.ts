/**
 * מודל פרויקט
 * Construction Master App - Project Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק פרויקט
export interface IProject extends Document {
    _id: string
    name: string
    description?: string
    client?: string
    address?: string
    startDate: Date
    endDate?: Date
    budget?: number
    currency?: 'ILS' | 'USD' | 'EUR' | 'GBP'
    status: 'planning' | 'active' | 'completed' | 'on_hold'
    ownerId: mongoose.Types.ObjectId
    assignedUsers: mongoose.Types.ObjectId[]
    tags?: string[]
    location?: {
        address?: string
        city?: string
        coordinates?: {
            lat: number
            lng: number
        }
    }
    createdAt: Date
    updatedAt: Date

    // פונקציות
    getProgress(): number
    getDaysRemaining(): number
    isOverdue(): boolean
}

// סכמת פרויקט
const projectSchema = new Schema<IProject>({
    name: {
        type: String,
        required: [true, 'שם הפרויקט נדרש'],
        trim: true,
        minlength: [3, 'שם הפרויקט חייב להכיל לפחות 3 תווים'],
        maxlength: [100, 'שם הפרויקט לא יכול להכיל יותר מ-100 תווים']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'התיאור לא יכול להכיל יותר מ-500 תווים']
    },
    client: {
        type: String,
        trim: true,
        minlength: [2, 'שם הלקוח חייב להכיל לפחות 2 תווים']
    },
    address: {
        type: String,
        trim: true,
        minlength: [5, 'כתובת הפרויקט חייבת להכיל לפחות 5 תווים']
    },
    startDate: {
        type: Date,
        required: [true, 'תאריך התחלה נדרש']
    },
    endDate: {
        type: Date
    },
    budget: {
        type: Number,
        min: [0, 'התקציב לא יכול להיות שלילי']
    },
    currency: {
        type: String,
        enum: {
            values: ['ILS', 'USD', 'EUR', 'GBP'],
            message: 'מטבע לא תקין'
        },
        default: 'ILS'
    },
    status: {
        type: String,
        enum: {
            values: ['planning', 'active', 'completed', 'on_hold'],
            message: 'סטטוס לא תקין'
        },
        default: 'planning'
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'בעל פרויקט נדרש']
    },
    assignedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [{
        type: String,
        trim: true
    }],
    location: {
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        coordinates: {
            lat: {
                type: Number,
                min: -90,
                max: 90
            },
            lng: {
                type: Number,
                min: -180,
                max: 180
            }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
projectSchema.index({ name: 1 })
projectSchema.index({ status: 1 })
projectSchema.index({ ownerId: 1 })
projectSchema.index({ assignedUsers: 1 })
projectSchema.index({ startDate: 1, endDate: 1 })

// Virtual fields
projectSchema.virtual('duration').get(function (this: IProject) {
    if (!this.endDate) return 0
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // ימים
})

projectSchema.virtual('isActive').get(function (this: IProject) {
    const now = new Date()
    return this.startDate <= now && (!this.endDate || this.endDate >= now) && this.status === 'active'
})

// פונקציות
projectSchema.methods.getProgress = function (): number {
    if (!this.endDate) return 0
    const now = new Date()
    const totalDuration = this.endDate.getTime() - this.startDate.getTime()
    const elapsed = now.getTime() - this.startDate.getTime()

    if (elapsed <= 0) return 0
    if (elapsed >= totalDuration) return 100

    return Math.round((elapsed / totalDuration) * 100)
}

projectSchema.methods.getDaysRemaining = function (): number {
    if (!this.endDate) return 0
    const now = new Date()
    const diffTime = this.endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

projectSchema.methods.isOverdue = function (): boolean {
    if (!this.endDate) return false
    const now = new Date()
    return this.endDate < now && this.status !== 'completed'
}

// Validation
projectSchema.pre('save', function (next: any) {
    if (this.endDate && this.startDate >= this.endDate) {
        next(new Error('תאריך התחלה חייב להיות לפני תאריך סיום'))
    } else {
        next()
    }
})

// יצירת המודל
const Project = mongoose.model<IProject>('Project', projectSchema)

export default Project
