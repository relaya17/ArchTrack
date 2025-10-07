/**
 * מודל משתמש
 * Construction Master App - User Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק משתמש
export interface IUser extends Document {
    _id: string
    email: string
    name: string
    password: string
    role: 'admin' | 'project_manager' | 'architect' | 'engineer' | 'contractor' | 'viewer'
    phone?: string
    avatar?: string
    isActive: boolean
    lastLogin?: Date
    resetPasswordToken?: string
    resetPasswordExpiry?: Date
    emailVerified: boolean
    emailVerificationToken?: string
    createdAt: Date
    updatedAt: Date

    // פונקציות
    comparePassword(candidatePassword: string): Promise<boolean>
    toJSON(): any
}

// סכמת משתמש
const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'כתובת אימייל נדרשת'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'כתובת אימייל לא תקינה']
    },
    name: {
        type: String,
        required: [true, 'שם משתמש נדרש'],
        trim: true,
        minlength: [2, 'השם חייב להכיל לפחות 2 תווים'],
        maxlength: [50, 'השם לא יכול להכיל יותר מ-50 תווים']
    },
    password: {
        type: String,
        required: [true, 'סיסמה נדרשת'],
        minlength: [8, 'הסיסמה חייבת להכיל לפחות 8 תווים']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'project_manager', 'architect', 'engineer', 'contractor', 'viewer'],
            message: 'תפקיד לא תקין'
        },
        default: 'viewer'
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'מספר טלפון לא תקין']
    },
    avatar: {
        type: String,
        match: [/^https?:\/\/.+/, 'כתובת תמונה לא תקינה']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpiry: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    }
}, {
    timestamps: true, // הוספת createdAt ו-updatedAt אוטומטית
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })

// Virtual fields
userSchema.virtual('fullName').get(function (this: IUser) {
    return this.name
})

// Middleware לפני שמירה
userSchema.pre('save', function (this: IUser, next: any) {
    // עדכון תאריך עדכון אחרון
    this.updatedAt = new Date()
    next()
})

// פונקציה להשוואת סיסמאות
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    // כאן תהיה השוואה עם bcrypt
    // כרגע מחזיר true לצורך פיתוח
    return true
}

// פונקציה להסרת סיסמה מהפלט
userSchema.methods.toJSON = function () {
    const userObject = this.toObject()
    delete userObject.password
    return userObject
}

// יצירת המודל
const User = mongoose.model<IUser>('User', userSchema)

export default User
