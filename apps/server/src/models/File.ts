/**
 * מודל קובץ
 * Construction Master App - File Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק קובץ
export interface IFile extends Document {
    _id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    path: string
    projectId: mongoose.Types.ObjectId
    uploadedBy: mongoose.Types.ObjectId
    category: 'drawing' | 'document' | 'image' | 'video' | 'general' | 'other'
    tags: string[]
    description?: string
    isPublic: boolean
    downloadCount: number
    lastDownloadedAt?: Date
    createdAt: Date
    updatedAt: Date

    // פונקציות
    getFileExtension(): string
    getFileSizeFormatted(): string
    isImage(): boolean
    isDocument(): boolean
}

// סכמת קובץ
const fileSchema = new Schema<IFile>({
    filename: {
        type: String,
        required: [true, 'שם קובץ נדרש'],
        trim: true
    },
    originalName: {
        type: String,
        required: [true, 'שם קובץ מקורי נדרש'],
        trim: true
    },
    mimeType: {
        type: String,
        required: [true, 'סוג קובץ נדרש'],
        trim: true
    },
    size: {
        type: Number,
        required: [true, 'גודל קובץ נדרש'],
        min: [0, 'גודל קובץ לא יכול להיות שלילי']
    },
    path: {
        type: String,
        required: [true, 'נתיב קובץ נדרש'],
        trim: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'מזהה פרויקט נדרש']
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'מעלה הקובץ נדרש']
    },
    category: {
        type: String,
        enum: {
            values: ['drawing', 'document', 'image', 'video', 'general', 'other'],
            message: 'קטגוריית קובץ לא תקינה'
        },
        default: 'general'
    },
    tags: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'התיאור לא יכול להכיל יותר מ-500 תווים']
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
fileSchema.index({ projectId: 1 })
fileSchema.index({ uploadedBy: 1 })
fileSchema.index({ category: 1 })
fileSchema.index({ tags: 1 })
fileSchema.index({ isPublic: 1 })

// Virtual fields
fileSchema.virtual('isLarge').get(function (this: IFile) {
    return this.size > 10 * 1024 * 1024 // 10MB
})

// פונקציות
fileSchema.methods.getFileExtension = function (): string {
    return this.originalName.split('.').pop()?.toLowerCase() || ''
}

fileSchema.methods.getFileSizeFormatted = function (): string {
    const bytes = this.size
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    if (bytes === 0) return '0 Bytes'

    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

fileSchema.methods.isImage = function (): boolean {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    return imageTypes.includes(this.getFileExtension())
}

fileSchema.methods.isDocument = function (): boolean {
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    return documentTypes.includes(this.getFileExtension())
}

// Middleware
fileSchema.pre('save', function (next: any) {
    // עדכון קטגוריה אוטומטית לפי סוג הקובץ
    if (this.isImage()) {
        this.category = 'image'
    } else if (this.isDocument()) {
        this.category = 'document'
    }

    next()
})

// יצירת המודל
const File = mongoose.model<IFile>('File', fileSchema)

export default File
