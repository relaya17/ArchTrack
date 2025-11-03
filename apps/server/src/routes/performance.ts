/**
 * Performance API Routes
 * Construction Master App - Performance Monitoring & Optimization
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import performanceService from '../services/performanceService'

const router = express.Router()

// סטטיסטיקות ביצועים
router.get('/stats',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const stats = performanceService.getPerformanceStats()

        res.json({
            success: true,
            data: stats
        })
    })
)

// בדיקת בריאות המערכת
router.get('/health',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const health = performanceService.getHealthStatus()

        res.status(health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 500).json({
            success: true,
            data: health
        })
    })
)

// אופטימיזציה של מסד הנתונים
router.post('/optimize/database',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await performanceService.optimizeDatabase()

        res.json({
            success: true,
            message: 'אופטימיזציה של מסד הנתונים הושלמה'
        })
    })
)

// אופטימיזציה של זיכרון
router.post('/optimize/memory',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await performanceService.optimizeMemory()

        res.json({
            success: true,
            message: 'אופטימיזציה של זיכרון הושלמה'
        })
    })
)

// ניקוי cache
router.post('/cache/clear',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const success = await performanceService.flush()

        res.json({
            success,
            message: success ? 'Cache נוקה בהצלחה' : 'שגיאה בניקוי Cache'
        })
    })
)

// בדיקת סטטוס cache
router.get('/cache/status',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const testKey = 'health_check_' + Date.now()
        const testValue = 'test_value'

        // בדיקת set
        const setSuccess = await performanceService.set(testKey, testValue, 60)

        // בדיקת get
        const getValue = await performanceService.get(testKey)

        // בדיקת del
        const delSuccess = await performanceService.del(testKey)

        res.json({
            success: true,
            data: {
                set: setSuccess,
                get: getValue === testValue,
                del: delSuccess,
                status: setSuccess && getValue === testValue && delSuccess ? 'healthy' : 'error'
            }
        })
    })
)

export default router

