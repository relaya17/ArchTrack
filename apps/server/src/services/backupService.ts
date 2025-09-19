/**
 * Backup Service
 * Construction Master App - Automated Backup System
 */

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import mongoose from 'mongoose'
import notificationService from './notificationService'
import Project from '../models/Project'
import User from '../models/User'
import Sheet from '../models/Sheet'
import File from '../models/File'
import ChatMessage from '../models/ChatMessage'
import Notification from '../models/Notification'

const execAsync = promisify(exec)

export interface BackupConfig {
    enabled: boolean
    schedule: string // cron expression
    retentionDays: number
    compress: boolean
    includeFiles: boolean
    storageType: 'local' | 's3' | 'google_drive'
    storageConfig: {
        local?: {
            path: string
        }
        s3?: {
            bucket: string
            region: string
            accessKeyId: string
            secretAccessKey: string
        }
        google_drive?: {
            clientId: string
            clientSecret: string
            refreshToken: string
            folderId: string
        }
    }
}

export interface BackupResult {
    success: boolean
    backupId: string
    timestamp: Date
    size: number
    duration: number
    files: string[]
    errors?: string[]
}

class BackupService {
    private config: BackupConfig
    private backupHistory: Map<string, BackupResult> = new Map()

    constructor() {
        this.config = this.loadConfig()
    }

    private loadConfig(): BackupConfig {
        return {
            enabled: process.env.BACKUP_ENABLED === 'true',
            schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
            retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
            compress: process.env.BACKUP_COMPRESS !== 'false',
            includeFiles: process.env.BACKUP_INCLUDE_FILES !== 'false',
            storageType: (process.env.BACKUP_STORAGE_TYPE as any) || 'local',
            storageConfig: {
                local: {
                    path: process.env.BACKUP_LOCAL_PATH || './backups'
                },
                s3: {
                    bucket: process.env.BACKUP_S3_BUCKET || '',
                    region: process.env.BACKUP_S3_REGION || 'us-east-1',
                    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY || '',
                    secretAccessKey: process.env.BACKUP_S3_SECRET_KEY || ''
                },
                google_drive: {
                    clientId: process.env.BACKUP_GD_CLIENT_ID || '',
                    clientSecret: process.env.BACKUP_GD_CLIENT_SECRET || '',
                    refreshToken: process.env.BACKUP_GD_REFRESH_TOKEN || '',
                    folderId: process.env.BACKUP_GD_FOLDER_ID || ''
                }
            }
        }
    }

    // יצירת גיבוי מלא
    async createFullBackup(): Promise<BackupResult> {
        const startTime = Date.now()
        const backupId = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
        const errors: string[] = []
        const files: string[] = []

        try {
            console.log(`🔄 Starting backup: ${backupId}`)

            // יצירת תיקיית גיבוי
            const backupDir = path.join(this.config.storageConfig.local?.path || './backups', backupId)
            await fs.mkdir(backupDir, { recursive: true })

            // גיבוי מסד הנתונים
            const dbBackupFile = await this.backupDatabase(backupDir, backupId)
            files.push(dbBackupFile)

            // גיבוי קבצים
            if (this.config.includeFiles) {
                const filesBackupDir = path.join(backupDir, 'files')
                await fs.mkdir(filesBackupDir, { recursive: true })
                await this.backupFiles(filesBackupDir)
                files.push(filesBackupDir)
            }

            // גיבוי הגדרות
            const configFile = await this.backupConfig(backupDir, backupId)
            files.push(configFile)

            // דחיסה
            let finalBackupPath = backupDir
            if (this.config.compress) {
                finalBackupPath = await this.compressBackup(backupDir, backupId)
                files.push(finalBackupPath)
            }

            // העלאה לאחסון חיצוני
            if (this.config.storageType !== 'local') {
                await this.uploadToExternalStorage(finalBackupPath, backupId)
            }

            const duration = Date.now() - startTime
            const size = await this.calculateBackupSize(finalBackupPath)

            const result: BackupResult = {
                success: true,
                backupId,
                timestamp: new Date(),
                size,
                duration,
                files,
                errors
            }

            this.backupHistory.set(backupId, result)
            await this.saveBackupHistory()

            console.log(`✅ Backup completed: ${backupId} (${duration}ms, ${this.formatSize(size)})`)

            // שליחת התראה
            await this.notifyBackupSuccess(result)

            return result

        } catch (error) {
            console.error(`❌ Backup failed: ${backupId}`, error)

            const result: BackupResult = {
                success: false,
                backupId,
                timestamp: new Date(),
                size: 0,
                duration: Date.now() - startTime,
                files,
                errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
            }

            this.backupHistory.set(backupId, result)
            await this.saveBackupHistory()

            // שליחת התראה על כישלון
            await this.notifyBackupFailure(result)

            throw error
        }
    }

    // גיבוי מסד הנתונים
    private async backupDatabase(backupDir: string, backupId: string): Promise<string> {
        const dbName = mongoose.connection.db?.databaseName || 'construction_master'
        const dbBackupFile = path.join(backupDir, `${backupId}_database.json`)

        console.log(`📊 Backing up database: ${dbName}`)

        try {
            // גיבוי כל הקולקשנים
            const collections = await mongoose.connection.db?.listCollections().toArray() || []
            const backupData: any = {
                metadata: {
                    backupId,
                    timestamp: new Date(),
                    database: dbName,
                    collections: collections.map(c => c.name)
                },
                collections: {}
            }

            for (const collection of collections) {
                const collectionName = collection.name
                const documents = await mongoose.connection.db?.collection(collectionName).find({}).toArray()

                backupData.collections[collectionName] = documents || []
                console.log(`  📄 Collection ${collectionName}: ${documents?.length || 0} documents`)
            }

            await fs.writeFile(dbBackupFile, JSON.stringify(backupData, null, 2), 'utf8')
            console.log(`✅ Database backup saved: ${dbBackupFile}`)

            return dbBackupFile

        } catch (error) {
            console.error('❌ Database backup failed:', error)
            throw error
        }
    }

    // גיבוי קבצים
    private async backupFiles(filesBackupDir: string): Promise<void> {
        console.log('📁 Backing up files...')

        try {
            const uploadsDir = path.join(process.cwd(), 'uploads')

            if (await this.pathExists(uploadsDir)) {
                await this.copyDirectory(uploadsDir, filesBackupDir)
                console.log('✅ Files backup completed')
            } else {
                console.log('⚠️ Uploads directory not found, skipping files backup')
            }

        } catch (error) {
            console.error('❌ Files backup failed:', error)
            throw error
        }
    }

    // גיבוי הגדרות
    private async backupConfig(backupDir: string, backupId: string): Promise<string> {
        const configFile = path.join(backupDir, `${backupId}_config.json`)

        const configData = {
            backupId,
            timestamp: new Date(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: {
                uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@') || 'hidden'
            },
            backup: this.config
        }

        await fs.writeFile(configFile, JSON.stringify(configData, null, 2), 'utf8')
        console.log(`✅ Config backup saved: ${configFile}`)

        return configFile
    }

    // דחיסת גיבוי
    private async compressBackup(backupDir: string, backupId: string): Promise<string> {
        const compressedFile = `${backupDir}.tar.gz`

        console.log(`🗜️ Compressing backup...`)

        try {
            await execAsync(`tar -czf "${compressedFile}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`)

            // מחיקת התיקייה המקורית
            await fs.rm(backupDir, { recursive: true, force: true })

            console.log(`✅ Backup compressed: ${compressedFile}`)
            return compressedFile

        } catch (error) {
            console.error('❌ Compression failed:', error)
            throw error
        }
    }

    // העלאה לאחסון חיצוני
    private async uploadToExternalStorage(backupPath: string, backupId: string): Promise<void> {
        console.log(`☁️ Uploading to ${this.config.storageType}...`)

        try {
            switch (this.config.storageType) {
                case 's3':
                    await this.uploadToS3(backupPath, backupId)
                    break
                case 'google_drive':
                    await this.uploadToGoogleDrive(backupPath, backupId)
                    break
                default:
                    console.log('⚠️ Unknown storage type, skipping upload')
            }

            console.log(`✅ Upload completed`)

        } catch (error) {
            console.error('❌ Upload failed:', error)
            throw error
        }
    }

    // העלאה ל-S3
    private async uploadToS3(backupPath: string, backupId: string): Promise<void> {
        const AWS = require('aws-sdk')
        const s3 = new AWS.S3({
            accessKeyId: this.config.storageConfig.s3?.accessKeyId,
            secretAccessKey: this.config.storageConfig.s3?.secretAccessKey,
            region: this.config.storageConfig.s3?.region
        })

        const fileContent = await fs.readFile(backupPath)
        const key = `backups/${backupId}/${path.basename(backupPath)}`

        await s3.upload({
            Bucket: this.config.storageConfig.s3?.bucket,
            Key: key,
            Body: fileContent,
            ServerSideEncryption: 'AES256'
        }).promise()
    }

    // העלאה ל-Google Drive
    private async uploadToGoogleDrive(backupPath: string, backupId: string): Promise<void> {
        // כאן יהיה קוד להעלאה ל-Google Drive
        console.log('📤 Google Drive upload not implemented yet')
    }

    // שחזור מגיבוי
    async restoreFromBackup(backupId: string): Promise<void> {
        console.log(`🔄 Restoring from backup: ${backupId}`)

        try {
            const backup = this.backupHistory.get(backupId)
            if (!backup) {
                throw new Error(`Backup ${backupId} not found`)
            }

            if (!backup.success) {
                throw new Error(`Backup ${backupId} was not successful`)
            }

            // כאן יהיה קוד לשחזור
            console.log('🔄 Restore functionality not implemented yet')

        } catch (error) {
            console.error('❌ Restore failed:', error)
            throw error
        }
    }

    // מחיקת גיבויים ישנים
    async cleanupOldBackups(): Promise<void> {
        console.log('🧹 Cleaning up old backups...')

        try {
            const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000))
            const backupsDir = this.config.storageConfig.local?.path || './backups'

            if (await this.pathExists(backupsDir)) {
                const entries = await fs.readdir(backupsDir, { withFileTypes: true })

                for (const entry of entries) {
                    if (entry.isDirectory() || entry.name.endsWith('.tar.gz')) {
                        const entryPath = path.join(backupsDir, entry.name)
                        const stats = await fs.stat(entryPath)

                        if (stats.mtime < cutoffDate) {
                            await fs.rm(entryPath, { recursive: true, force: true })
                            console.log(`🗑️ Deleted old backup: ${entry.name}`)
                        }
                    }
                }
            }

            // מחיקת היסטוריית גיבויים ישנה
            for (const [backupId, backup] of this.backupHistory) {
                if (backup.timestamp < cutoffDate) {
                    this.backupHistory.delete(backupId)
                }
            }

            await this.saveBackupHistory()
            console.log('✅ Cleanup completed')

        } catch (error) {
            console.error('❌ Cleanup failed:', error)
            throw error
        }
    }

    // קבלת רשימת גיבויים
    getBackupHistory(): BackupResult[] {
        return Array.from(this.backupHistory.values()).sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        )
    }

    // קבלת הגדרות גיבוי
    getBackupConfig(): BackupConfig {
        return { ...this.config }
    }

    // עדכון הגדרות גיבוי
    updateBackupConfig(newConfig: Partial<BackackConfig>): void {
        this.config = { ...this.config, ...newConfig }
        this.saveBackupConfig()
    }

    // שמירת היסטוריית גיבויים
    private async saveBackupHistory(): Promise<void> {
        const historyFile = path.join(process.cwd(), 'backup-history.json')
        await fs.writeFile(historyFile, JSON.stringify(this.getBackupHistory(), null, 2))
    }

    // טעינת היסטוריית גיבויים
    private async loadBackupHistory(): Promise<void> {
        try {
            const historyFile = path.join(process.cwd(), 'backup-history.json')

            if (await this.pathExists(historyFile)) {
                const data = await fs.readFile(historyFile, 'utf8')
                const history = JSON.parse(data)

                for (const backup of history) {
                    this.backupHistory.set(backup.backupId, backup)
                }
            }
        } catch (error) {
            console.error('Failed to load backup history:', error)
        }
    }

    // שמירת הגדרות גיבוי
    private async saveBackupConfig(): Promise<void> {
        const configFile = path.join(process.cwd(), 'backup-config.json')
        await fs.writeFile(configFile, JSON.stringify(this.config, null, 2))
    }

    // חישוב גודל גיבוי
    private async calculateBackupSize(backupPath: string): Promise<number> {
        try {
            const stats = await fs.stat(backupPath)
            return stats.size
        } catch (error) {
            return 0
        }
    }

    // עזרים
    private async pathExists(path: string): Promise<boolean> {
        try {
            await fs.access(path)
            return true
        } catch {
            return false
        }
    }

    private async copyDirectory(src: string, dest: string): Promise<void> {
        await fs.mkdir(dest, { recursive: true })
        const entries = await fs.readdir(src, { withFileTypes: true })

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath)
            } else {
                await fs.copyFile(srcPath, destPath)
            }
        }
    }

    private formatSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        if (bytes === 0) return '0 Bytes'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    // התראות
    private async notifyBackupSuccess(backup: BackupResult): Promise<void> {
        try {
            // שליחת התראה למנהלי מערכת
            const admins = await User.find({ role: 'admin' })

            for (const admin of admins) {
                await notificationService.createNotification({
                    recipient: admin._id.toString(),
                    template: {
                        title: 'גיבוי הושלם בהצלחה',
                        message: `גיבוי ${backup.backupId} הושלם בהצלחה (${this.formatSize(backup.size)})`,
                        type: 'success',
                        priority: 'low',
                        channels: ['email', 'in_app']
                    }
                })
            }
        } catch (error) {
            console.error('Failed to send backup success notification:', error)
        }
    }

    private async notifyBackupFailure(backup: BackupResult): Promise<void> {
        try {
            // שליחת התראה למנהלי מערכת
            const admins = await User.find({ role: 'admin' })

            for (const admin of admins) {
                await notificationService.createNotification({
                    recipient: admin._id.toString(),
                    template: {
                        title: 'גיבוי נכשל',
                        message: `גיבוי ${backup.backupId} נכשל: ${backup.errors?.join(', ') || 'Unknown error'}`,
                        type: 'error',
                        priority: 'high',
                        channels: ['email', 'push', 'in_app']
                    }
                })
            }
        } catch (error) {
            console.error('Failed to send backup failure notification:', error)
        }
    }
}

export default new BackupService()

