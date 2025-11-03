/**
 * Notification Service
 * Construction Master App - Advanced Notification System
 */

import nodemailer from 'nodemailer'
import twilio from 'twilio'
import Notification, { INotification } from '../models/Notification'
import User from '../models/User'
import Project from '../models/Project'
import SocketService from './socketService'

// Types
export interface NotificationTemplate {
    title: string
    message: string
    type: INotification['type']
    priority: INotification['priority']
    channels: INotification['channels']
}

export interface NotificationData {
    recipient: string
    sender?: string
    projectId?: string
    relatedEntity?: {
        type: 'project' | 'sheet' | 'file' | 'user' | 'ai_chat'
        id: string
    }
    template?: NotificationTemplate
    customData?: {
        title?: string
        message?: string
        type?: INotification['type']
        priority?: INotification['priority']
        channels?: INotification['channels']
    }
    scheduledAt?: Date
}

class NotificationService {
    private emailTransporter: nodemailer.Transporter
    private twilioClient: twilio.Twilio
    private socketService: SocketService

    constructor() {
        this.initializeEmail()
        this.initializeSMS()
        this.initializeSocketService()
    }

    private initializeEmail() {
        this.emailTransporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }

    private initializeSMS() {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            )
        }
    }

    private initializeSocketService() {
        // Socket service will be injected later
        this.socketService = null as any
    }

    setSocketService(socketService: SocketService) {
        this.socketService = socketService
    }

    // יצירת התראה חדשה
    async createNotification(data: NotificationData): Promise<INotification> {
        try {
            const template = data.template || this.getDefaultTemplate(data.customData?.type || 'info')

            const notification = new Notification({
                title: data.customData?.title || template.title,
                message: data.customData?.message || template.message,
                type: data.customData?.type || template.type,
                priority: data.customData?.priority || template.priority,
                channels: data.customData?.channels || template.channels,
                recipient: data.recipient,
                sender: data.sender,
                projectId: data.projectId,
                relatedEntity: data.relatedEntity,
                scheduledAt: data.scheduledAt || new Date(),
                status: data.scheduledAt && data.scheduledAt > new Date() ? 'pending' : 'pending'
            })

            await notification.save()

            // שליחה מיידית אם לא מתוזמן
            if (!data.scheduledAt || data.scheduledAt <= new Date()) {
                await this.sendNotification(notification)
            }

            return notification
        } catch (error) {
            console.error('שגיאה ביצירת התראה:', error)
            throw error
        }
    }

    // שליחת התראה
    async sendNotification(notification: INotification): Promise<void> {
        try {
            const user = await User.findById(notification.recipient)
            if (!user) {
                throw new Error('משתמש לא נמצא')
            }

            let allChannelsSent = true
            const results = {
                email: false,
                push: false,
                sms: false,
                inApp: false
            }

            // שליחה בערוץ Email
            if (notification.channels.includes('email') && user.email) {
                try {
                    await this.sendEmail(notification, user.email)
                    results.email = true
                    notification.metadata!.emailSent = true
                } catch (error) {
                    console.error('שגיאה בשליחת email:', error)
                    allChannelsSent = false
                }
            }

            // שליחה בערוץ Push Notification
            if (notification.channels.includes('push')) {
                try {
                    await this.sendPushNotification(notification, user)
                    results.push = true
                    notification.metadata!.pushSent = true
                } catch (error) {
                    console.error('שגיאה בשליחת push notification:', error)
                    allChannelsSent = false
                }
            }

            // שליחה בערוץ SMS
            if (notification.channels.includes('sms') && user.phone) {
                try {
                    await this.sendSMS(notification, user.phone)
                    results.sms = true
                    notification.metadata!.smsSent = true
                } catch (error) {
                    console.error('שגיאה בשליחת SMS:', error)
                    allChannelsSent = false
                }
            }

            // שליחה בערוץ In-App
            if (notification.channels.includes('in_app')) {
                try {
                    await this.sendInAppNotification(notification, user._id)
                    results.inApp = true
                } catch (error) {
                    console.error('שגיאה בשליחת in-app notification:', error)
                    allChannelsSent = false
                }
            }

            // עדכון סטטוס
            if (allChannelsSent) {
                await notification.markAsSent()
            } else {
                notification.status = 'failed'
                notification.metadata!.errorMessage = 'חלק מהערוצים נכשלו'
                await notification.save()
            }

        } catch (error) {
            console.error('שגיאה בשליחת התראה:', error)
            notification.status = 'failed'
            notification.metadata!.errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה'
            await notification.save()
            throw error
        }
    }

    // שליחת Email
    private async sendEmail(notification: INotification, email: string): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@constructionmaster.com',
            to: email,
            subject: `[Construction Master] ${notification.title}`,
            html: this.generateEmailTemplate(notification)
        }

        await this.emailTransporter.sendMail(mailOptions)
    }

    // שליחת Push Notification
    private async sendPushNotification(notification: INotification, user: any): Promise<void> {
        // כאן יהיה קוד לשליחת push notification
        // לדוגמה: Firebase Cloud Messaging, OneSignal וכו'
        console.log(`Push notification sent to user ${user._id}: ${notification.title}`)
    }

    // שליחת SMS
    private async sendSMS(notification: INotification, phone: string): Promise<void> {
        if (!this.twilioClient) {
            throw new Error('Twilio לא מוגדר')
        }

        await this.twilioClient.messages.create({
            body: `${notification.title}: ${notification.message}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        })
    }

    // שליחת In-App Notification
    private async sendInAppNotification(notification: INotification, userId: string): Promise<void> {
        if (this.socketService) {
            this.socketService.sendNotificationToUser(userId, notification)
        }
    }

    // תבניות התראות
    private getDefaultTemplate(type: string): NotificationTemplate {
        const templates: Record<string, NotificationTemplate> = {
            project_update: {
                title: 'עדכון פרויקט',
                message: 'הפרויקט שלך עודכן',
                type: 'project_update',
                priority: 'medium',
                channels: ['email', 'in_app']
            },
            deadline: {
                title: 'דדליין מתקרב',
                message: 'יש לך דדליין שמתקרב',
                type: 'deadline',
                priority: 'high',
                channels: ['email', 'push', 'in_app']
            },
            team_invite: {
                title: 'הזמנה לצוות',
                message: 'הוזמנת להצטרף לצוות פרויקט',
                type: 'team_invite',
                priority: 'medium',
                channels: ['email', 'in_app']
            },
            file_upload: {
                title: 'קובץ חדש',
                message: 'קובץ חדש הועלה לפרויקט',
                type: 'file_upload',
                priority: 'low',
                channels: ['in_app']
            },
            ai_response: {
                title: 'תשובת AI',
                message: 'קיבלת תשובה מעוזר ה-AI',
                type: 'ai_response',
                priority: 'low',
                channels: ['in_app']
            },
            info: {
                title: 'הודעה חדשה',
                message: 'יש לך הודעה חדשה',
                type: 'info',
                priority: 'low',
                channels: ['in_app']
            }
        }

        return templates[type] || templates.info
    }

    // תבנית Email
    private generateEmailTemplate(notification: INotification): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${notification.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
                    .content { line-height: 1.6; }
                    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Construction Master</h1>
                        <h2>${notification.title}</h2>
                    </div>
                    <div class="content">
                        <p>${notification.message}</p>
                        ${notification.projectId ? '<p><strong>פרויקט:</strong> <a href="#">צפה בפרויקט</a></p>' : ''}
                    </div>
                    <div class="footer">
                        <p>הודעה זו נשלחה מ-Construction Master</p>
                        <p>אם אינך רוצה לקבל התראות, ניתן לבטל אותן בהגדרות החשבון</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    // קבלת התראות למשתמש
    async getUserNotifications(userId: string, options: {
        page?: number
        limit?: number
        status?: string
        type?: string
        unreadOnly?: boolean
    } = {}): Promise<{
        notifications: INotification[]
        total: number
        unreadCount: number
    }> {
        const { page = 1, limit = 20, status, type, unreadOnly = false } = options

        const query: any = {
            recipient: userId,
            isActive: true
        }

        if (status) query.status = status
        if (type) query.type = type
        if (unreadOnly) query.readAt = { $exists: false }

        const skip = (page - 1) * limit

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .populate('sender', 'name email')
                .populate('projectId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(query),
            Notification.countDocuments({
                ...query,
                readAt: { $exists: false }
            })
        ])

        return { notifications, total, unreadCount }
    }

    // סימון התראה כנקראה
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        })

        if (notification) {
            await notification.markAsRead()
        }
    }

    // סימון כל ההתראות כנקראות
    async markAllAsRead(userId: string): Promise<void> {
        await Notification.updateMany(
            { recipient: userId, readAt: { $exists: false } },
            { readAt: new Date(), status: 'read' }
        )
    }

    // מחיקת התראות ישנות
    async cleanupOldNotifications(): Promise<void> {
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))

        await Notification.updateMany(
            {
                createdAt: { $lt: thirtyDaysAgo },
                status: { $in: ['read', 'failed'] }
            },
            { isActive: false }
        )
    }

    // שליחת התראות מתוזמנות
    async processScheduledNotifications(): Promise<void> {
        const now = new Date()
        const pendingNotifications = await Notification.find({
            scheduledAt: { $lte: now },
            status: 'pending'
        }).limit(50) // Process in batches

        for (const notification of pendingNotifications) {
            try {
                await this.sendNotification(notification)
            } catch (error) {
                console.error(`שגיאה בשליחת התראה ${notification._id}:`, error)
                notification.metadata!.retryCount = (notification.metadata?.retryCount || 0) + 1
                if (notification.shouldRetry()) {
                    notification.status = 'pending'
                    notification.scheduledAt = new Date(Date.now() + (5 * 60 * 1000)) // Retry in 5 minutes
                } else {
                    notification.status = 'failed'
                }
                await notification.save()
            }
        }
    }

    // התראות אוטומטיות לפרויקטים
    async createProjectNotifications(projectId: string, type: string, additionalData?: any): Promise<void> {
        const project = await Project.findById(projectId).populate('assignedUsers')
        if (!project) return

        const notifications: NotificationData[] = []

        switch (type) {
            case 'deadline_approaching':
                notifications.push({
                    recipient: project.ownerId.toString(),
                    projectId,
                    template: {
                        title: 'דדליין מתקרב',
                        message: `הפרויקט "${project.name}" מתקרב למועד הסיום`,
                        type: 'deadline',
                        priority: 'high',
                        channels: ['email', 'push', 'in_app']
                    }
                })
                break

            case 'project_completed':
                for (const userId of project.assignedUsers) {
                    notifications.push({
                        recipient: userId.toString(),
                        projectId,
                        template: {
                            title: 'פרויקט הושלם',
                            message: `הפרויקט "${project.name}" הושלם בהצלחה`,
                            type: 'success',
                            priority: 'medium',
                            channels: ['email', 'in_app']
                        }
                    })
                }
                break

            case 'team_member_added':
                notifications.push({
                    recipient: additionalData.newMemberId,
                    projectId,
                    template: {
                        title: 'הצטרפת לצוות',
                        message: `הוספת לצוות הפרויקט "${project.name}"`,
                        type: 'team_invite',
                        priority: 'medium',
                        channels: ['email', 'in_app']
                    }
                })
                break
        }

        // יצירת כל ההתראות
        for (const notificationData of notifications) {
            try {
                await this.createNotification(notificationData)
            } catch (error) {
                console.error('שגיאה ביצירת התראה אוטומטית:', error)
            }
        }
    }
}

export default new NotificationService()

