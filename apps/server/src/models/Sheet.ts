/**
 * מודל גיליון
 * Construction Master App - Sheet Model
 */

import mongoose, { Document, Schema } from 'mongoose'

// ממשק תא
export interface ICell {
    row: number
    col: number
    value: string | number
    formula?: string
    type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'formula'
    category?: 'concrete' | 'steel' | 'gypsum' | 'electrical' | 'plumbing' | 'general'
    style?: {
        backgroundColor?: string
        textColor?: string
        fontWeight?: 'normal' | 'bold'
        fontSize?: number
    }
}

// ממשק גיליון
export interface ISheet extends Document {
    _id: string
    name: string
    type: 'boq' | 'estimate' | 'schedule' | 'materials' | 'costs' | 'diary'
    description?: string
    projectId: mongoose.Types.ObjectId
    createdBy: mongoose.Types.ObjectId
    cells: ICell[]
    metadata: {
        rowCount: number
        colCount: number
        lastModified: Date
        version: number
    }
    isTemplate: boolean
    templateId?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date

    // פונקציות
    getCell(row: number, col: number): ICell | undefined
    setCell(row: number, col: number, value: string | number, type?: string): void
    getFormula(row: number, col: number): string | undefined
    setFormula(row: number, col: number, formula: string): void
    calculateFormulas(): void
}

// סכמת תא
const cellSchema = new Schema<ICell>({
    row: {
        type: Number,
        required: true,
        min: 0
    },
    col: {
        type: Number,
        required: true,
        min: 0
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },
    formula: {
        type: String
    },
    type: {
        type: String,
        enum: ['text', 'number', 'currency', 'percentage', 'date', 'formula'],
        default: 'text'
    },
    category: {
        type: String,
        enum: ['concrete', 'steel', 'gypsum', 'electrical', 'plumbing', 'general']
    },
    style: {
        backgroundColor: String,
        textColor: String,
        fontWeight: {
            type: String,
            enum: ['normal', 'bold']
        },
        fontSize: Number
    }
}, { _id: false })

// סכמת גיליון
const sheetSchema = new Schema<ISheet>({
    name: {
        type: String,
        required: [true, 'שם הגיליון נדרש'],
        trim: true,
        minlength: [3, 'שם הגיליון חייב להכיל לפחות 3 תווים'],
        maxlength: [100, 'שם הגיליון לא יכול להכיל יותר מ-100 תווים']
    },
    type: {
        type: String,
        enum: {
            values: ['boq', 'estimate', 'schedule', 'materials', 'costs', 'diary'],
            message: 'סוג גיליון לא תקין'
        },
        required: [true, 'סוג גיליון נדרש']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'התיאור לא יכול להכיל יותר מ-500 תווים']
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'מזהה פרויקט נדרש']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'יוצר הגיליון נדרש']
    },
    cells: [cellSchema],
    metadata: {
        rowCount: {
            type: Number,
            default: 100
        },
        colCount: {
            type: Number,
            default: 26
        },
        lastModified: {
            type: Date,
            default: Date.now
        },
        version: {
            type: Number,
            default: 1
        }
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'Sheet'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// אינדקסים
sheetSchema.index({ projectId: 1 })
sheetSchema.index({ type: 1 })
sheetSchema.index({ createdBy: 1 })
sheetSchema.index({ isTemplate: 1 })

// פונקציות
sheetSchema.methods.getCell = function (row: number, col: number): ICell | undefined {
    return this.cells.find((cell: ICell) => cell.row === row && cell.col === col)
}

sheetSchema.methods.setCell = function (row: number, col: number, value: string | number, type: string = 'text'): void {
    const existingCell = this.cells.find((cell: ICell) => cell.row === row && cell.col === col)

    if (existingCell) {
        existingCell.value = value
        existingCell.type = type as any
    } else {
        this.cells.push({ row, col, value, type: type as any })
    }

    this.metadata.lastModified = new Date()
    this.metadata.version += 1
}

sheetSchema.methods.getFormula = function (row: number, col: number): string | undefined {
    const cell = this.getCell(row, col)
    return cell?.formula
}

sheetSchema.methods.setFormula = function (row: number, col: number, formula: string): void {
    const existingCell = this.cells.find((cell: ICell) => cell.row === row && cell.col === col)

    if (existingCell) {
        existingCell.formula = formula
        existingCell.type = 'formula'
    } else {
        this.cells.push({ row, col, value: '', formula, type: 'formula' })
    }

    this.metadata.lastModified = new Date()
    this.metadata.version += 1
}

sheetSchema.methods.calculateFormulas = function (): void {
    // כאן תהיה לוגיקה לחישוב נוסחאות
    // כרגע זה placeholder
    // console.log('מחשב נוסחאות...')
}

// Middleware
sheetSchema.pre('save', function (next: any) {
    this.metadata.lastModified = new Date()
    next()
})

// יצירת המודל
const Sheet = mongoose.model<ISheet>('Sheet', sheetSchema)

export default Sheet
