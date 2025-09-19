/**
 * פונקציות עיצוב ופורמט למערכת הבנייה
 * Construction Master App - Formatting Utilities
 */

import { CURRENCY_SYMBOLS, UNITS, UNIT_LABELS } from './constants'

/**
 * עיצוב מטבע
 * @param amount - הסכום
 * @param currency - המטבע (ברירת מחדל: ILS)
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @returns מחרוזת מעוצבת
 */
export function formatCurrency(
    amount: number,
    currency: string = 'ILS',
    locale: string = 'he-IL'
): string {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * עיצוב מספר
 * @param number - המספר
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @param decimals - מספר ספרות אחרי הנקודה
 * @returns מחרוזת מעוצבת
 */
export function formatNumber(
    number: number,
    locale: string = 'he-IL',
    decimals: number = 2
): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(number)
}

/**
 * עיצוב אחוז
 * @param value - הערך (0-100)
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @param decimals - מספר ספרות אחרי הנקודה
 * @returns מחרוזת מעוצבת
 */
export function formatPercentage(
    value: number,
    locale: string = 'he-IL',
    decimals: number = 1
): string {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100)
}

/**
 * עיצוב תאריך
 * @param date - התאריך
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @param options - אפשרויות עיצוב
 * @returns מחרוזת מעוצבת
 */
export function formatDate(
    date: Date | string,
    locale: string = 'he-IL',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

/**
 * עיצוב זמן
 * @param date - התאריך/זמן
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @param options - אפשרויות עיצוב
 * @returns מחרוזת מעוצבת
 */
export function formatTime(
    date: Date | string,
    locale: string = 'he-IL',
    options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

/**
 * עיצוב תאריך וזמן
 * @param date - התאריך/זמן
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @returns מחרוזת מעוצבת
 */
export function formatDateTime(
    date: Date | string,
    locale: string = 'he-IL'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj)
}

/**
 * עיצוב גודל קובץ
 * @param bytes - גודל הקובץ בבייטים
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @returns מחרוזת מעוצבת
 */
export function formatFileSize(
    bytes: number,
    locale: string = 'he-IL'
): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * עיצוב יחידת מידה
 * @param value - הערך
 * @param unit - היחידה
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @param decimals - מספר ספרות אחרי הנקודה
 * @returns מחרוזת מעוצבת
 */
export function formatUnit(
    value: number,
    unit: string,
    locale: string = 'he-IL',
    decimals: number = 2
): string {
    const formattedValue = formatNumber(value, locale, decimals)
    const unitLabel = UNIT_LABELS[unit as keyof typeof UNIT_LABELS] || unit

    return `${formattedValue} ${unitLabel}`
}

/**
 * עיצוב זמן יחסי (לפני X זמן)
 * @param date - התאריך
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @returns מחרוזת מעוצבת
 */
export function formatRelativeTime(
    date: Date | string,
    locale: string = 'he-IL'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'לפני רגע'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `לפני ${diffInMinutes} דקות`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `לפני ${diffInHours} שעות`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
        return `לפני ${diffInDays} ימים`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
        return `לפני ${diffInWeeks} שבועות`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
        return `לפני ${diffInMonths} חודשים`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `לפני ${diffInYears} שנים`
}

/**
 * עיצוב מספר טלפון
 * @param phone - מספר הטלפון
 * @param locale - הלוקל (ברירת מחדל: he-IL)
 * @returns מחרוזת מעוצבת
 */
export function formatPhone(phone: string, locale: string = 'he-IL'): string {
    // הסר כל תווים שאינם מספרים
    const cleaned = phone.replace(/\D/g, '')

    // עיצוב למספר ישראלי
    if (locale === 'he-IL' && cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }

    // עיצוב למספר בינלאומי
    if (cleaned.length > 10) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1-$2-$3-$4')
    }

    return phone
}

/**
 * עיצוב כתובת אימייל
 * @param email - כתובת האימייל
 * @returns מחרוזת מעוצבת
 */
export function formatEmail(email: string): string {
    return email.toLowerCase().trim()
}

/**
 * עיצוב קוד פרויקט
 * @param code - הקוד
 * @returns מחרוזת מעוצבת
 */
export function formatProjectCode(code: string): string {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * עיצוב שם קובץ
 * @param filename - שם הקובץ
 * @param maxLength - אורך מקסימלי
 * @returns מחרוזת מעוצבת
 */
export function formatFilename(filename: string, maxLength: number = 30): string {
    if (filename.length <= maxLength) {
        return filename
    }

    const extension = filename.split('.').pop()
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4)

    return `${truncatedName}...${extension}`
}

/**
 * עיצוב נוסחה
 * @param formula - הנוסחה
 * @returns מחרוזת מעוצבת
 */
export function formatFormula(formula: string): string {
    if (!formula.startsWith('=')) {
        return `=${formula}`
    }
    return formula
}

/**
 * עיצוב קוד BOQ
 * @param code - הקוד
 * @returns מחרוזת מעוצבת
 */
export function formatBOQCode(code: string): string {
    // הסר תווים מיוחדים ושמור רק אותיות ומספרים
    const cleaned = code.replace(/[^A-Z0-9]/gi, '')

    // הוסף מקפים כל 3 תווים
    return cleaned.replace(/(.{3})/g, '$1-').replace(/-$/, '')
}

/**
 * עיצוב מספר הזמנה
 * @param orderNumber - מספר ההזמנה
 * @returns מחרוזת מעוצבת
 */
export function formatOrderNumber(orderNumber: string): string {
    // הוסף אפסים מובילים אם נדרש
    const padded = orderNumber.padStart(6, '0')
    return `ORD-${padded}`
}

/**
 * עיצוב מספר חשבונית
 * @param invoiceNumber - מספר החשבונית
 * @returns מחרוזת מעוצבת
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
    const padded = invoiceNumber.padStart(8, '0')
    return `INV-${padded}`
}

/**
 * עיצוב מספר חוזה
 * @param contractNumber - מספר החוזה
 * @returns מחרוזת מעוצבת
 */
export function formatContractNumber(contractNumber: string): string {
    const padded = contractNumber.padStart(4, '0')
    return `CON-${padded}`
}
