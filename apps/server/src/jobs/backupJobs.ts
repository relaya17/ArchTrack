/**
 * Backup Jobs
 * Construction Master App - Scheduled Backup Tasks
 */

import cron from 'node-cron'
import backupService from '../services/backupService'

class BackupJobs {
    private jobs: Map<string, cron.ScheduledTask> = new Map()

    constructor() {
        this.initializeJobs()
    }

    private initializeJobs() {
        const config = backupService.getBackupConfig()

        if (config.enabled) {
            // גיבוי מתוזמן - לפי הגדרות המשתמש
            this.scheduleJob('scheduled-backup', config.schedule, async () => {
                console.log('🔄 Starting scheduled backup...')
                try {
                    await backupService.createFullBackup()
                    console.log('✅ Scheduled backup completed')
                } catch (error) {
                    console.error('❌ Scheduled backup failed:', error)
                }
            })

            // ניקוי גיבויים ישנים - כל יום ב-3:00 בלילה
            this.scheduleJob('cleanup-backups', '0 3 * * *', async () => {
                console.log('🧹 Cleaning up old backups...')
                try {
                    await backupService.cleanupOldBackups()
                    console.log('✅ Backup cleanup completed')
                } catch (error) {
                    console.error('❌ Backup cleanup failed:', error)
                }
            })

            console.log('🚀 Backup Jobs initialized')
        } else {
            console.log('⚠️ Backup Jobs disabled')
        }
    }

    private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>) {
        const job = cron.schedule(cronExpression, task, {
            scheduled: true,
            timezone: 'Asia/Jerusalem'
        })

        this.jobs.set(name, job)
        console.log(`📋 Backup Job "${name}" scheduled: ${cronExpression}`)
    }

    // הפעלת job ספציפי
    public startJob(name: string) {
        const job = this.jobs.get(name)
        if (job) {
            job.start()
            console.log(`▶️ Backup Job "${name}" started`)
        }
    }

    // עצירת job ספציפי
    public stopJob(name: string) {
        const job = this.jobs.get(name)
        if (job) {
            job.stop()
            console.log(`⏹️ Backup Job "${name}" stopped`)
        }
    }

    // הפעלת כל ה-jobs
    public startAllJobs() {
        for (const [name, job] of this.jobs) {
            job.start()
            console.log(`▶️ Backup Job "${name}" started`)
        }
    }

    // עצירת כל ה-jobs
    public stopAllJobs() {
        for (const [name, job] of this.jobs) {
            job.stop()
            console.log(`⏹️ Backup Job "${name}" stopped`)
        }
    }

    // קבלת רשימת jobs
    public getJobsStatus() {
        const status: any = {}
        for (const [name, job] of this.jobs) {
            status[name] = {
                running: true, // Simplified status
                nextRun: new Date().toISOString() // Simplified next run
            }
        }
        return status
    }

    // הרצת job ידנית
    public async runJobManually(name: string) {
        const job = this.jobs.get(name)
        if (job) {
            try {
                console.log(`🔄 Running backup job "${name}" manually...`)
                await job.fire()
                console.log(`✅ Backup job "${name}" completed manually`)
            } catch (error) {
                console.error(`❌ Error running backup job "${name}":`, error)
                throw error
            }
        } else {
            throw new Error(`Backup job "${name}" not found`)
        }
    }

    // עדכון jobs לפי הגדרות חדשות
    public updateJobs() {
        // עצירת jobs קיימים
        this.stopAllJobs()

        // יצירת jobs חדשים
        this.initializeJobs()

        // הפעלת jobs חדשים
        this.startAllJobs()
    }
}

export default new BackupJobs()

