/**
 * Hook מותאם לשמירה ב-LocalStorage
 * עם תמיכה ב-TypeScript ו-React
 */

import { useState, useEffect } from 'react'

/**
 * Hook לשמירה וטעינה מ-LocalStorage
 * @param key - המפתח ב-LocalStorage
 * @param initialValue - הערך הראשוני אם אין נתונים
 * @returns [value, setValue] - הערך הנוכחי ופונקציה לעדכון
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    // State להחזקת הערך הנוכחי
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            // נסה לטעון מ-LocalStorage
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    // פונקציה לעדכון הערך
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // אפשר לקבל פונקציה או ערך ישיר
            const valueToStore = value instanceof Function ? value(storedValue) : value

            // עדכן את ה-state
            setStoredValue(valueToStore)

            // שמור ב-LocalStorage
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    }

    return [storedValue, setValue]
}

/**
 * Hook למחיקת נתונים מ-LocalStorage
 * @param key - המפתח למחיקה
 */
export function useRemoveFromStorage(key: string) {
    return () => {
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error)
        }
    }
}

/**
 * Hook לניקוי כל ה-LocalStorage
 */
export function useClearStorage() {
    return () => {
        try {
            window.localStorage.clear()
        } catch (error) {
            console.warn('Error clearing localStorage:', error)
        }
    }
}
