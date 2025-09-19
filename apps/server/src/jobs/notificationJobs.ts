/**
 * Notification Jobs
 * Construction Master App - Scheduled Notification Tasks
 */

import cron from 'node-cron'
import notificationService from '../services/notificationService'
import Project from '../models/Project'

class NotificationJobs {
    private jobs: Map<string, cron.ScheduledTask> = new Map()

    constructor() {
        this.initializeJobs()
    }

    private initializeJobs() {
        // ניקוי התראות ישנות - כל יום ב-2:00 בלילה
        this.scheduleJob('cleanup-notifications', '0 2 * * *', async () => {
            console.log('🧹 מנקה התראות ישנות...')
            try {
                await notificationService.cleanupOldNotifications()
                console.log('✅ ניקוי התראות הושלם')
            } catch (error) {
                console.error('❌ שגיאה בניקוי התראות:', error)
            }
        })

        // עיבוד התראות מתוזמנות - כל 5 דקות
        this.scheduleJob('process-scheduled', '*/5 * * * *', async () => {
            console.log('⏰ מעבד התראות מתוזמנות...')
            try {
                await notificationService.processScheduledNotifications()
                console.log('✅ עיבוד התראות הושלם')
            } catch (error) {
                console.error('❌ שגיאה בעיבוד התראות:', error)
            }
        })

        // בדיקת דדליינים - כל יום ב-9:00 בבוקר
        this.scheduleJob('check-deadlines', '0 9 * * *', async () => {
            console.log('📅 בודק דדליינים...')
            try {
                await this.checkProjectDeadlines()
                console.log('✅ בדיקת דדליינים הושלמה')
            } catch (error) {
                console.error('❌ שגיאה בבדיקת דדליינים:', error)
            }
        })

        // בדיקת פרויקטים פעילים - כל שעה
        this.scheduleJob('check-active-projects', '0 * * * *', async () => {
            console.log('🔍 בודק פרויקטים פעילים...')
            try {
                await this.checkActiveProjects()
                console.log('✅ בדיקת פרויקטים הושלמה')
            } catch (error) {
                console.error('❌ שגיאה בבדיקת פרויקטים:', error)
            }
        })

        console.log('🚀 Notification Jobs initialized')
    }

    private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>) {
        const job = cron.schedule(cronExpression, task, {
            scheduled: true,
            timezone: 'Asia/Jerusalem'
        })

        this.jobs.set(name, job)
        console.log(`📋 Job "${name}" scheduled: ${cronExpression}`)
    }

    // בדיקת דדליינים של פרויקטים
    private async checkProjectDeadlines() {
        const now = new Date()
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
        const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

        // פרויקטים עם דדליין בעוד 3 ימים
        const urgentDeadlines = await Project.find({
            endDate: {
                $gte: now,
                $lte: threeDaysFromNow
            },
            status: 'active'
        })

        // פרויקטים עם דדליין בעוד שבוע
        const upcomingDeadlines = await Project.find({
            endDate: {
                $gte: threeDaysFromNow,
                $lte: oneWeekFromNow
            },
            status: 'active'
        })

        // שליחת התראות דחופות
        for (const project of urgentDeadlines) {
            await notificationService.createProjectNotifications(
                project._id.toString(),
                'deadline_approaching'
            )
        }

        // שליחת התראות רגילות
        for (const project of upcomingDeadlines) {
            await notificationService.createProjectNotifications(
                project._id.toString(),
                'deadline_approaching'
            )
        }
    }

    // בדיקת פרויקטים פעילים
    private async checkActiveProjects() {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))

        // פרויקטים שלא עודכנו יותר מיום
        const staleProjects = await Project.find({
            status: 'active',
            updatedAt: { $lt: oneDayAgo }
        })

        // שליחת התראות למנהלי פרויקטים
        for (const project of staleProjects) {
            await notificationService.createNotification({
                recipient: project.ownerId.toString(),
                projectId: project._id.toString(),
                template: {
                    title: 'פרויקט לא עודכן',
                    message: `הפרויקט "${project.name}" לא עודכן יותר מיום`,
                    type: 'warning',
                    priority: 'medium',
                    channels: ['email', 'in_app']
                }
            })
        }
    }

    // הפעלת job ספציפי
    public startJob(name: string) {
        const job = this.jobs.get(name)
        if (job) {
            job.start()
            console.log(`▶️ Job "${name}" started`)
        }
    }

    // עצירת job ספציפי
    public stopJob(name: string) {
        const job = this.jobs.get(name)
        if (job) {
            job.stop()
            console.log(`⏹️ Job "${name}" stopped`)
        }
    }

    // הפעלת כל ה-jobs
    public startAllJobs() {
        for (const [name, job] of this.jobs) {
            job.start()
            console.log(`▶️ Job "${name}" started`)
        }
    }

    // עצירת כל ה-jobs
    public stopAllJobs() {
        for (const [name, job] of this.jobs) {
            job.stop()
            console.log(`⏹️ Job "${name}" stopped`)
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
                console.log(`🔄 Running job "${name}" manually...`)
                await job.fire()
                console.log(`✅ Job "${name}" completed manually`)
            } catch (error) {
                console.error(`❌ Error running job "${name}":`, error)
                throw error
            }
        } else {
            throw new Error(`Job "${name}" not found`)
        }
    }
}

export default new NotificationJobs()

