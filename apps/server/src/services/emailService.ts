/**
 * Email Service
 * Construction Master App - Advanced Email Service
 */

import nodemailer from 'nodemailer'
import logger from '../config/logger'

interface EmailOptions {
    to: string | string[]
    subject: string
    html: string
    text?: string
    attachments?: Array<{
        filename: string
        content: Buffer | string
        contentType?: string
    }>
}

interface EmailTemplate {
    subject: string
    html: string
    text: string
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null
    private isInitialized = false

    constructor() {
        this.initialize()
    }

    /**
     * Initialize email service
     */
    private async initialize(): Promise<void> {
        try {
            // Check if email configuration is available
            if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                logger.warn('Email service not configured - SMTP settings missing')
                return
            }

            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            })

            // Verify connection
            await this.transporter.verify()
            this.isInitialized = true
            logger.info('Email service initialized successfully')

        } catch (error) {
            logger.error('Failed to initialize email service:', error)
            this.isInitialized = false
        }
    }

    /**
     * Send email
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.isInitialized || !this.transporter) {
            logger.warn('Email service not available - logging email instead')
            this.logEmail(options)
            return false
        }

        try {
            const mailOptions = {
                from: `"ProBuilder" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments
            }

            const result = await this.transporter.sendMail(mailOptions)
            logger.info(`Email sent successfully to ${options.to}:`, result.messageId)
            return true

        } catch (error) {
            logger.error('Failed to send email:', error)
            return false
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
        
        const template = this.getVerificationEmailTemplate(verificationUrl)
        
        return await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        })
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
        
        const template = this.getPasswordResetEmailTemplate(resetUrl)
        
        return await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        })
    }

    /**
     * Send project invitation email
     */
    async sendProjectInvitationEmail(
        email: string, 
        projectName: string, 
        inviterName: string, 
        invitationToken: string
    ): Promise<boolean> {
        const invitationUrl = `${process.env.CLIENT_URL}/accept-invitation?token=${invitationToken}`
        
        const template = this.getProjectInvitationEmailTemplate(
            projectName, 
            inviterName, 
            invitationUrl
        )
        
        return await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        })
    }

    /**
     * Send project update notification
     */
    async sendProjectUpdateEmail(
        email: string, 
        projectName: string, 
        updateType: string, 
        updateDetails: string
    ): Promise<boolean> {
        const projectUrl = `${process.env.CLIENT_URL}/projects`
        
        const template = this.getProjectUpdateEmailTemplate(
            projectName, 
            updateType, 
            updateDetails, 
            projectUrl
        )
        
        return await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        })
    }

    /**
     * Send system alert email
     */
    async sendSystemAlertEmail(
        email: string, 
        alertType: string, 
        alertMessage: string, 
        severity: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<boolean> {
        const template = this.getSystemAlertEmailTemplate(alertType, alertMessage, severity)
        
        return await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        })
    }

    /**
     * Get verification email template
     */
    private getVerificationEmailTemplate(verificationUrl: string): EmailTemplate {
        return {
            subject: 'אימות כתובת אימייל - ProBuilder',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2980b9;">ברוכים הבאים ל-ProBuilder!</h2>
                    <p>תודה שנרשמת למערכת ProBuilder לניהול פרויקטי בנייה.</p>
                    <p>כדי להשלים את ההרשמה, אנא לחץ על הקישור הבא לאימות כתובת האימייל שלך:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #2980b9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            אימות כתובת אימייל
                        </a>
                    </div>
                    <p>אם הקישור לא עובד, העתק והדבק את הכתובת הבאה בדפדפן:</p>
                    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        אם לא נרשמת למערכת, אנא התעלם מההודעה הזו.
                    </p>
                </div>
            `,
            text: `
                ברוכים הבאים ל-ProBuilder!
                
                תודה שנרשמת למערכת ProBuilder לניהול פרויקטי בנייה.
                
                כדי להשלים את ההרשמה, אנא לחץ על הקישור הבא:
                ${verificationUrl}
                
                אם לא נרשמת למערכת, אנא התעלם מההודעה הזו.
            `
        }
    }

    /**
     * Get password reset email template
     */
    private getPasswordResetEmailTemplate(resetUrl: string): EmailTemplate {
        return {
            subject: 'איפוס סיסמה - ProBuilder',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">איפוס סיסמה</h2>
                    <p>קיבלנו בקשה לאיפוס הסיסמה שלך ב-ProBuilder.</p>
                    <p>כדי ליצור סיסמה חדשה, אנא לחץ על הקישור הבא:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            איפוס סיסמה
                        </a>
                    </div>
                    <p>אם הקישור לא עובד, העתק והדבק את הכתובת הבאה בדפדפן:</p>
                    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                    <p><strong>הקישור תקף למשך 24 שעות בלבד.</strong></p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        אם לא ביקשת איפוס סיסמה, אנא התעלם מההודעה הזו.
                    </p>
                </div>
            `,
            text: `
                איפוס סיסמה - ProBuilder
                
                קיבלנו בקשה לאיפוס הסיסמה שלך ב-ProBuilder.
                
                כדי ליצור סיסמה חדשה, אנא לחץ על הקישור הבא:
                ${resetUrl}
                
                הקישור תקף למשך 24 שעות בלבד.
                
                אם לא ביקשת איפוס סיסמה, אנא התעלם מההודעה הזו.
            `
        }
    }

    /**
     * Get project invitation email template
     */
    private getProjectInvitationEmailTemplate(
        projectName: string, 
        inviterName: string, 
        invitationUrl: string
    ): EmailTemplate {
        return {
            subject: `הזמנה לפרויקט "${projectName}" - ProBuilder`,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">הזמנה לפרויקט</h2>
                    <p>שלום,</p>
                    <p><strong>${inviterName}</strong> הזמין אותך להצטרף לפרויקט <strong>"${projectName}"</strong> ב-ProBuilder.</p>
                    <p>כדי להצטרף לפרויקט, אנא לחץ על הקישור הבא:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${invitationUrl}" 
                           style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            הצטרף לפרויקט
                        </a>
                    </div>
                    <p>אם הקישור לא עובד, העתק והדבק את הכתובת הבאה בדפדפן:</p>
                    <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        אם לא ציפית להזמנה זו, אנא התעלם מההודעה הזו.
                    </p>
                </div>
            `,
            text: `
                הזמנה לפרויקט "${projectName}" - ProBuilder
                
                שלום,
                
                ${inviterName} הזמין אותך להצטרף לפרויקט "${projectName}" ב-ProBuilder.
                
                כדי להצטרף לפרויקט, אנא לחץ על הקישור הבא:
                ${invitationUrl}
                
                אם לא ציפית להזמנה זו, אנא התעלם מההודעה הזו.
            `
        }
    }

    /**
     * Get project update email template
     */
    private getProjectUpdateEmailTemplate(
        projectName: string, 
        updateType: string, 
        updateDetails: string, 
        projectUrl: string
    ): EmailTemplate {
        return {
            subject: `עדכון פרויקט "${projectName}" - ProBuilder`,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f39c12;">עדכון פרויקט</h2>
                    <p>שלום,</p>
                    <p>יש עדכון חדש בפרויקט <strong>"${projectName}"</strong>:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2c3e50;">${updateType}</h3>
                        <p style="margin-bottom: 0;">${updateDetails}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${projectUrl}" 
                           style="background-color: #f39c12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            צפה בפרויקט
                        </a>
                    </div>
                </div>
            `,
            text: `
                עדכון פרויקט "${projectName}" - ProBuilder
                
                שלום,
                
                יש עדכון חדש בפרויקט "${projectName}":
                
                ${updateType}
                ${updateDetails}
                
                צפה בפרויקט: ${projectUrl}
            `
        }
    }

    /**
     * Get system alert email template
     */
    private getSystemAlertEmailTemplate(
        alertType: string, 
        alertMessage: string, 
        severity: string
    ): EmailTemplate {
        const severityColors = {
            low: '#3498db',
            medium: '#f39c12',
            high: '#e74c3c',
            critical: '#8e44ad'
        }

        const severityTexts = {
            low: 'נמוך',
            medium: 'בינוני',
            high: 'גבוה',
            critical: 'קריטי'
        }

        return {
            subject: `התראה ${severityTexts[severity as keyof typeof severityTexts]} - ProBuilder`,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${severityColors[severity as keyof typeof severityColors]};">התראה ${severityTexts[severity as keyof typeof severityTexts]}</h2>
                    <p>שלום,</p>
                    <p>קיבלנו התראה חדשה במערכת ProBuilder:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${severityColors[severity as keyof typeof severityColors]};">
                        <h3 style="margin-top: 0; color: #2c3e50;">${alertType}</h3>
                        <p style="margin-bottom: 0;">${alertMessage}</p>
                    </div>
                    <p>אנא בדוק את המערכת בהקדם האפשרי.</p>
                </div>
            `,
            text: `
                התראה ${severityTexts[severity as keyof typeof severityTexts]} - ProBuilder
                
                שלום,
                
                קיבלנו התראה חדשה במערכת ProBuilder:
                
                ${alertType}
                ${alertMessage}
                
                אנא בדוק את המערכת בהקדם האפשרי.
            `
        }
    }

    /**
     * Log email when service is not available
     */
    private logEmail(options: EmailOptions): void {
        logger.info('Email would be sent:', {
            to: options.to,
            subject: options.subject,
            html: options.html.substring(0, 200) + '...'
        })
    }

    /**
     * Check if email service is available
     */
    isAvailable(): boolean {
        return this.isInitialized && this.transporter !== null
    }
}

export default new EmailService()
