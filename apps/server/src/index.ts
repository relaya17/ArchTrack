/**
 * שרת Express למערכת הבנייה
 * Construction Master App - Express Server
 */

// Optimize memory usage for Render
process.env.UV_THREADPOOL_SIZE = '2'
process.env.NODE_OPTIONS = '--max-old-space-size=400'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { connectDatabase } from './config/database'
import { initSentry } from './config/sentry'
import { startAlertManager } from './config/alerts'
import logger from './config/logger'
import SocketService from './services/socketService'
import collaborationService from './services/collaborationService'
import notificationService from './services/notificationService'
import notificationJobs from './jobs/notificationJobs'
import backupService from './services/backupService'
import backupJobs from './jobs/backupJobs'
import performanceService from './services/performanceService'
import monitoringService from './services/monitoringService'

// Import middleware
import { securityHeaders, requestTimeout } from './middleware/security'
import { sanitizeInput } from './middleware/validation'
import { rateLimiters } from './middleware/security'
import { errorHandler, notFoundHandler, initializeErrorHandlers } from './middleware/errorHandler'
import monitoringMiddleware from './middleware/monitoring'

// Import routes
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import sheetRoutes from './routes/sheets'
import fileRoutes from './routes/files'
import aiRoutes from './routes/ai'
import analyticsRoutes from './routes/analytics'
import notificationRoutes from './routes/notifications'
import backupRoutes from './routes/backup'
import performanceRoutes from './routes/performance'
import monitoringRoutes from './routes/monitoring'
import healthRoutes from './routes/health'
import offlineRoutes from './routes/offline'
import pushNotificationRoutes from './routes/pushNotifications'
import realTimeMetricsRoutes from './routes/realTimeMetrics'
import customReportsRoutes from './routes/customReports'
import logsRoutes from './routes/logs'
import advancedAuthRoutes from './routes/advancedAuth'
import bimRoutes from './routes/bim'
import advancedAnalyticsRoutes from './routes/advancedAnalytics'
import advancedReportingRoutes from './routes/advancedReporting'
import enterpriseRoutes from './routes/enterprise'

// טעינת משתני סביבה
dotenv.config()

// Initialize Sentry first
initSentry()

// יצירת אפליקציית Express
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 6453

// Initialize Socket.IO
let socketService: SocketService

// Security middleware
app.use(securityHeaders)

// Request timeout
app.use(requestTimeout(30000)) // 30 seconds

// Middleware בסיסי
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
    crossOriginEmbedderPolicy: false
})) // אבטחה
app.use(compression()) // דחיסה

// Monitoring middleware (before other middleware)
app.use(monitoringMiddleware)

// CORS
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:3132',
            'http://localhost:3227',
        ].filter(Boolean) as string[]

        // Allow React Native (no Origin header)
        if (!origin) {
            return callback(null, true)
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}))

// Performance middleware
app.use(performanceService.performanceMiddleware())

// Input sanitization
app.use(sanitizeInput)

// Parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    })
})

// API Routes
app.use('/api/auth', rateLimiters.auth, authRoutes)
app.use('/api/projects', rateLimiters.general, projectRoutes)
app.use('/api/sheets', rateLimiters.general, sheetRoutes)
app.use('/api/files', rateLimiters.upload, fileRoutes)
app.use('/api/ai', rateLimiters.ai, aiRoutes)
app.use('/api/analytics', rateLimiters.analytics, analyticsRoutes)
app.use('/api/notifications', rateLimiters.general, notificationRoutes)
app.use('/api/backup', rateLimiters.general, backupRoutes)
app.use('/api/performance', rateLimiters.general, performanceRoutes)
app.use('/api/monitoring', rateLimiters.general, monitoringRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/offline', offlineRoutes)
app.use('/api/push-notifications', pushNotificationRoutes)
app.use('/api/metrics', realTimeMetricsRoutes)
app.use('/api/reports', customReportsRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api/auth/advanced', advancedAuthRoutes)
app.use('/api/bim', bimRoutes)
app.use('/api/analytics/advanced', advancedAnalyticsRoutes)
app.use('/api/reports/advanced', advancedReportingRoutes)
app.use('/api/enterprise', enterpriseRoutes)

// 404 handler (must be before error handler)
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

// הפעלת השרת
async function startServer() {
    try {
        // Initialize global error handlers
        initializeErrorHandlers()

        // חיבור למסד הנתונים
        await connectDatabase()

        // Start alert manager
        startAlertManager()

        // Initialize Socket.IO service
        socketService = new SocketService(server)

        // Initialize collaboration service
        collaborationService.initialize(socketService.getIO())

        // Connect notification service to socket
        notificationService.setSocketService(socketService)

        // Start notification jobs (only in development)
        if (process.env.NODE_ENV !== 'production') {
            notificationJobs.startAllJobs()
            backupJobs.startAllJobs()
        }

        // הפעלת השרת
        server.listen(PORT, () => {
            logger.info(`🚀 שרת פועל על פורט ${PORT}`)
            logger.info(`🌍 סביבה: ${process.env.NODE_ENV || 'development'}`)
            logger.info(`📊 Health Check: http://localhost:${PORT}/api/health`)
            logger.info(`📊 Metrics: http://localhost:${PORT}/api/health/metrics`)
            logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`)
            logger.info(`📁 Projects API: http://localhost:${PORT}/api/projects`)
            logger.info(`📊 Sheets API: http://localhost:${PORT}/api/sheets`)
            logger.info(`📁 Files API: http://localhost:${PORT}/api/files`)
            logger.info(`🤖 AI API: http://localhost:${PORT}/api/ai`)
            logger.info(`📊 Analytics API: http://localhost:${PORT}/api/analytics`)
            logger.info(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`)
            logger.info(`💾 Backup API: http://localhost:${PORT}/api/backup`)
            logger.info(`⚡ Performance API: http://localhost:${PORT}/api/performance`)
            logger.info(`📊 Monitoring API: http://localhost:${PORT}/api/monitoring`)
            logger.info(`🔌 WebSocket: ws://localhost:${PORT}`)
        })
    } catch (error) {
        logger.error('❌ שגיאה בהפעלת השרת:', error)
        process.exit(1)
    }
}

// טיפול בסגירת האפליקציה
process.on('SIGINT', () => {
    logger.info('\n🛑 מקבל SIGINT, סוגר את השרת...')
    process.exit(0)
})

process.on('SIGTERM', () => {
    logger.info('\n🛑 מקבל SIGTERM, סוגר את השרת...')
    process.exit(0)
})

// הפעלה
startServer()

export default app
