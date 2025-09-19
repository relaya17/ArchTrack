/**
 * הגדרת מסד נתונים MongoDB
 * Construction Master App - Database Configuration
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

// טעינת משתני סביבה
dotenv.config()

// הגדרות חיבור למסד הנתונים
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-master'
const MONGODB_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // שמירה על חיבור פתוח
    serverSelectionTimeoutMS: 5000, // זמן המתנה לבחירת שרת
    socketTimeoutMS: 45000, // זמן המתנה לסוקט
    bufferMaxEntries: 0, // השבתת buffering
    bufferCommands: false, // השבתת buffering של פקודות
}

// פונקציה לחיבור למסד הנתונים
export async function connectDatabase(): Promise<void> {
    try {
        // בדיקה אם כבר מחובר
        if (mongoose.connection.readyState === 1) {
            console.log('✅ כבר מחובר למסד הנתונים MongoDB')
            return
        }

        // חיבור למסד הנתונים
        await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS)

        console.log('✅ התחבר בהצלחה למסד הנתונים MongoDB')
        console.log(`📊 מסד נתונים: ${mongoose.connection.name}`)
        console.log(`🌐 URI: ${MONGODB_URI}`)

    } catch (error) {
        console.error('❌ שגיאה בחיבור למסד הנתונים MongoDB:', error)
        throw error
    }
}

// פונקציה לניתוק ממסד הנתונים
export async function disconnectDatabase(): Promise<void> {
    try {
        await mongoose.disconnect()
        console.log('✅ נותק ממסד הנתונים MongoDB')
    } catch (error) {
        console.error('❌ שגיאה בניתוק ממסד הנתונים:', error)
        throw error
    }
}

// פונקציה לבדיקת סטטוס החיבור
export function getConnectionStatus(): string {
    const states = {
        0: 'מנותק',
        1: 'מחובר',
        2: 'מתחבר',
        3: 'מתנתק'
    }

    return states[mongoose.connection.readyState as keyof typeof states] || 'לא ידוע'
}

// פונקציה לניקוי מסד הנתונים (לפיתוח בלבד)
export async function clearDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('לא ניתן לנקות מסד נתונים בסביבת ייצור')
    }

    try {
        if (!mongoose.connection.db) {
            throw new Error('לא מחובר למסד הנתונים')
        }
        await mongoose.connection.db.dropDatabase()
        console.log('✅ מסד הנתונים נוקה בהצלחה')
    } catch (error) {
        console.error('❌ שגיאה בניקוי מסד הנתונים:', error)
        throw error
    }
}

// Event listeners לחיבור
mongoose.connection.on('connected', () => {
    console.log('🔗 MongoDB מחובר')
})

mongoose.connection.on('error', (error: any) => {
    console.error('❌ שגיאת MongoDB:', error)
})

mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB מנותק')
})

// טיפול בסגירת האפליקציה
process.on('SIGINT', async () => {
    await disconnectDatabase()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    await disconnectDatabase()
    process.exit(0)
})

export default mongoose
