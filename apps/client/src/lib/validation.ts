/**
 * פונקציות אימות למערכת הבנייה
 * Construction Master App - Validation Utilities
 */

import { z } from 'zod'

// סכמות אימות בסיסיות
export const emailSchema = z.string().email('כתובת אימייל לא תקינה')

export const phoneSchema = z.string().regex(
    /^[\+]?[0-9\s\-\(\)]{10,}$/,
    'מספר טלפון לא תקין'
)

export const passwordSchema = z.string()
    .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
    .regex(/[A-Z]/, 'הסיסמה חייבת להכיל לפחות אות גדולה אחת')
    .regex(/[a-z]/, 'הסיסמה חייבת להכיל לפחות אות קטנה אחת')
    .regex(/[0-9]/, 'הסיסמה חייבת להכיל לפחות ספרה אחת')

export const nameSchema = z.string()
    .min(2, 'השם חייב להכיל לפחות 2 תווים')
    .max(50, 'השם לא יכול להכיל יותר מ-50 תווים')

// סכמות אימות למשתמש
export const userSchema = z.object({
    email: emailSchema,
    name: nameSchema,
    role: z.enum(['admin', 'project_manager', 'architect', 'engineer', 'contractor', 'viewer']),
    phone: phoneSchema.optional(),
    avatar: z.string().url().optional(),
})

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'סיסמה נדרשת'),
})

export const registerSchema = z.object({
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['architect', 'engineer', 'contractor']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
})

// סכמות אימות לפרויקט
export const projectSchema = z.object({
    name: z.string().min(3, 'שם הפרויקט חייב להכיל לפחות 3 תווים'),
    description: z.string().optional(),
    client: z.string().min(2, 'שם הלקוח נדרש'),
    address: z.string().min(5, 'כתובת הפרויקט נדרשת'),
    startDate: z.date(),
    endDate: z.date(),
    budget: z.number().positive('התקציב חייב להיות חיובי'),
    currency: z.enum(['ILS', 'USD', 'EUR', 'GBP']),
    status: z.enum(['planning', 'active', 'completed', 'on_hold']),
})

// סכמות אימות לגיליון
export const sheetSchema = z.object({
    name: z.string().min(3, 'שם הגיליון חייב להכיל לפחות 3 תווים'),
    type: z.enum(['boq', 'estimate', 'schedule', 'materials', 'costs', 'diary']),
    description: z.string().optional(),
    projectId: z.string().uuid('מזהה פרויקט לא תקין'),
})

// סכמות אימות לתא
export const cellSchema = z.object({
    row: z.number().int().min(0, 'מספר שורה חייב להיות חיובי'),
    col: z.number().int().min(0, 'מספר עמודה חייב להיות חיובי'),
    value: z.union([z.string(), z.number()]),
    formula: z.string().optional(),
    type: z.enum(['text', 'number', 'currency', 'percentage', 'date', 'formula']),
    category: z.enum(['concrete', 'steel', 'gypsum', 'electrical', 'plumbing', 'general']).optional(),
})

// סכמות אימות לפריט BOQ
export const boqItemSchema = z.object({
    code: z.string().min(1, 'קוד פריט נדרש'),
    description: z.string().min(5, 'תיאור פריט נדרש'),
    unit: z.string().min(1, 'יחידת מידה נדרשת'),
    quantity: z.number().positive('כמות חייבת להיות חיובית'),
    unitPrice: z.number().min(0, 'מחיר יחידה לא יכול להיות שלילי'),
    category: z.enum(['concrete', 'steel', 'gypsum', 'electrical', 'plumbing', 'general']),
})

// סכמות אימות לקובץ
export const fileSchema = z.object({
    name: z.string().min(1, 'שם קובץ נדרש'),
    type: z.string().min(1, 'סוג קובץ נדרש'),
    size: z.number().positive('גודל קובץ חייב להיות חיובי'),
    url: z.string().url('כתובת קובץ לא תקינה'),
})

// סכמות אימות להודעת צ'אט
export const chatMessageSchema = z.object({
    text: z.string().min(1, 'הודעה לא יכולה להיות ריקה').max(1000, 'הודעה ארוכה מדי'),
    projectId: z.string().uuid('מזהה פרויקט לא תקין'),
    linkedCellId: z.string().uuid().optional(),
    linkedComponentId: z.string().uuid().optional(),
})

// פונקציות אימות מותאמות
export function validateEmail(email: string): boolean {
    try {
        emailSchema.parse(email)
        return true
    } catch {
        return false
    }
}

export function validatePhone(phone: string): boolean {
    try {
        phoneSchema.parse(phone)
        return true
    } catch {
        return false
    }
}

export function validatePassword(password: string): boolean {
    try {
        passwordSchema.parse(password)
        return true
    } catch {
        return false
    }
}

export function validateProjectCode(code: string): boolean {
    // קוד פרויקט: 3-6 תווים, אותיות ומספרים בלבד
    const projectCodeRegex = /^[A-Z0-9]{3,6}$/
    return projectCodeRegex.test(code)
}

export function validateBOQCode(code: string): boolean {
    // קוד BOQ: פורמט XXX-XXX או XXX-XXX-XXX
    const boqCodeRegex = /^[A-Z0-9]{3}(-[A-Z0-9]{3}){1,2}$/
    return boqCodeRegex.test(code)
}

export function validateFormula(formula: string): boolean {
    // בדיקה בסיסית לנוסחה
    if (!formula.startsWith('=')) {
        return false
    }

    // בדיקה שהנוסחה לא מכילה תווים מסוכנים
    const dangerousChars = /[<>{}]/
    if (dangerousChars.test(formula)) {
        return false
    }

    // בדיקה שהנוסחה מכילה לפחות פונקציה או אופרטור
    const hasFunction = /[A-Z]+\(/.test(formula)
    const hasOperator = /[+\-*/]/.test(formula)
    const hasReference = /[A-Z]+\d+/.test(formula)

    return hasFunction || hasOperator || hasReference
}

export function validateCurrency(amount: string): boolean {
    // בדיקה שמדובר במספר תקין
    const number = parseFloat(amount)
    return !isNaN(number) && isFinite(number) && number >= 0
}

export function validatePercentage(value: string): boolean {
    const number = parseFloat(value)
    return !isNaN(number) && isFinite(number) && number >= 0 && number <= 100
}

export function validateDate(date: string): boolean {
    const dateObj = new Date(date)
    return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension ? allowedTypes.includes(extension) : false
}

export function validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize
}

export function validateProjectName(name: string): boolean {
    // שם פרויקט: 3-100 תווים, אותיות, מספרים, רווחים וסימני פיסוק בסיסיים
    const projectNameRegex = /^[a-zA-Z0-9\u0590-\u05FF\s\-_.,()]{3,100}$/
    return projectNameRegex.test(name)
}

export function validateAddress(address: string): boolean {
    // כתובת: לפחות 5 תווים, אותיות, מספרים, רווחים וסימני פיסוק
    const addressRegex = /^[a-zA-Z0-9\u0590-\u05FF\s\-_.,()]{5,}$/
    return addressRegex.test(address)
}

export function validateQuantity(quantity: string): boolean {
    const number = parseFloat(quantity)
    return !isNaN(number) && isFinite(number) && number > 0
}

export function validateUnitPrice(price: string): boolean {
    const number = parseFloat(price)
    return !isNaN(number) && isFinite(number) && number >= 0
}

// פונקציות אימות מורכבות
export function validateProjectDates(startDate: Date, endDate: Date): boolean {
    return startDate < endDate
}

export function validateBudget(budget: number, spent: number): boolean {
    return budget > 0 && spent >= 0 && spent <= budget
}

export function validateProgress(progress: number): boolean {
    return progress >= 0 && progress <= 100
}

export function validateRiskScore(probability: number, impact: number): boolean {
    return probability >= 0 && probability <= 100 && impact >= 0 && impact <= 10
}

// פונקציות אימות מותאמות לענף הבנייה
export function validateConcreteGrade(grade: string): boolean {
    // בדיקת דרגת בטון (למשל: C25, C30, C35)
    const concreteGradeRegex = /^C[0-9]{2,3}$/
    return concreteGradeRegex.test(grade)
}

export function validateSteelGrade(grade: string): boolean {
    // בדיקת דרגת פלדה (למשל: B500B, S235)
    const steelGradeRegex = /^[A-Z][0-9]{3}[A-Z]?$/
    return steelGradeRegex.test(grade)
}

export function validateBuildingCode(code: string): boolean {
    // בדיקת קוד בניין (למשל: 123/45)
    const buildingCodeRegex = /^[0-9]{1,4}\/[0-9]{1,4}$/
    return buildingCodeRegex.test(code)
}

export function validatePermitNumber(number: string): boolean {
    // בדיקת מספר היתר בנייה
    const permitRegex = /^[0-9]{6,8}$/
    return permitRegex.test(number)
}

export function validateContractNumber(number: string): boolean {
    // בדיקת מספר חוזה
    const contractRegex = /^CON-[0-9]{4,6}$/
    return contractRegex.test(number)
}

// פונקציות אימות מותאמות ל-BIM
export function validateBIMComponent(component: {
    type: string;
    properties: Record<string, unknown>;
    name?: string;
    volume?: number;
    cost?: number;
}): boolean {
    return (
        component &&
        typeof component.type === 'string' &&
        ['wall', 'beam', 'column', 'slab', 'door', 'window', 'roof'].includes(component.type) &&
        (!component.name || (typeof component.name === 'string' && component.name.length > 0)) &&
        (!component.volume || (typeof component.volume === 'number' && component.volume > 0)) &&
        (!component.cost || (typeof component.cost === 'number' && component.cost >= 0))
    )
}

export function validateCoordinates(coordinates: { x: number; y: number; z?: number }): boolean {
    return (
        coordinates &&
        typeof coordinates.x === 'number' &&
        typeof coordinates.y === 'number' &&
        typeof coordinates.z === 'number' &&
        isFinite(coordinates.x) &&
        isFinite(coordinates.y) &&
        isFinite(coordinates.z)
    )
}
