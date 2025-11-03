/**
 * מודל הודעת צ'אט
 * Construction Master App - Chat Message Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק הודעת צ'אט
export interface IChatMessage extends Document {
    _id: string
    text: string
    projectId: mongoose.Types.ObjectId
    senderId: mongoose.Types.ObjectId
    linkedCellId?: mongoose.Types.ObjectId
    linkedComponentId?: mongoose.Types.ObjectId
    linkedFileId?: mongoose.Types.ObjectId
    messageType: 'text' | 'file' | 'system' | 'mention'
    isEdited: boolean
    editedAt?: Date
    reactions: {
        emoji: string
        userId: mongoose.Types.ObjectId
        createdAt: Date
    }[]
    isRead: boolean
    readBy: {
        userId: mongoose.Types.ObjectId
        readAt: Date
    }[]
    createdAt: Date
    updatedAt: Date

    // פונקציות
    addReaction(emoji: string, userId: string): void
    removeReaction(emoji: string, userId: string): void
    markAsRead(userId: string): void
    isMentioned(userId: string): boolean
}

// סכמת הודעת צ'אט
const chatMessageSchema = new Schema<IChatMessage>({
    text: {
        type: String,
        required: [true, 'תוכן הודעה נדרש'],
        trim: true,
        minlength: [1, 'הודעה לא יכולה להיות ריקה'],
        maxlength: [1000, 'הודעה ארוכה מדי']
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'מזהה פרויקט נדרש']
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'שולח ההודעה נדרש']
    },
    linkedCellId: {
        type: Schema.Types.ObjectId,
        ref: 'Sheet'
    },
    linkedComponentId: {
        type: Schema.Types.ObjectId
    },
    linkedFileId: {
        type: Schema.Types.ObjectId,
        ref: 'File'
    },
    messageType: {
        type: String,
        enum: {
            values: ['text', 'file', 'system', 'mention'],
            message: 'סוג הודעה לא תקין'
        },
        default: 'text'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    reactions: [{
        emoji: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
chatMessageSchema.index({ projectId: 1, createdAt: -1 })
chatMessageSchema.index({ senderId: 1 })
chatMessageSchema.index({ linkedCellId: 1 })
chatMessageSchema.index({ linkedFileId: 1 })

// פונקציות
chatMessageSchema.methods.addReaction = function (emoji: string, userId: string): void {
    // בדיקה אם המשתמש כבר הגיב עם האמוג'י הזה
    const existingReaction = this.reactions.find(
        (reaction: any) => reaction.emoji === emoji && reaction.userId.toString() === userId
    )

    if (!existingReaction) {
        this.reactions.push({
            emoji,
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: new Date()
        })
    }
}

chatMessageSchema.methods.removeReaction = function (emoji: string, userId: string): void {
    this.reactions = this.reactions.filter(
        (reaction: any) => !(reaction.emoji === emoji && reaction.userId.toString() === userId)
    )
}

chatMessageSchema.methods.markAsRead = function (userId: string): void {
    const existingRead = this.readBy.find(
        (read: any) => read.userId.toString() === userId
    )

    if (!existingRead) {
        this.readBy.push({
            userId: new mongoose.Types.ObjectId(userId),
            readAt: new Date()
        })
    }

    this.isRead = this.readBy.length > 0
}

chatMessageSchema.methods.isMentioned = function (userId: string): boolean {
    // בדיקה אם המשתמש מוזכר בהודעה
    const mentionPattern = new RegExp(`@${userId}`, 'i')
    return mentionPattern.test(this.text)
}

// Middleware
chatMessageSchema.pre('save', function (next: any) {
    if (this.isModified('text') && !this.isNew) {
        this.isEdited = true
        this.editedAt = new Date()
    }
    next()
})

// יצירת המודל
const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema)

export default ChatMessage
