/**
 * Offline Routes
 * Construction Master App - Offline Data Synchronization API
 */

import express from 'express';
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { rateLimiters } from '../middleware/security';
import { asyncHandler } from '../middleware/errorHandler';
import offlineService from '../services/offlineService';
import logger from '../config/logger';

const router = express.Router();

// Rate limiting for offline endpoints
router.use(rateLimiters.general);

// Authentication required for all routes
router.use(authenticateToken);

// Get offline data
router.get('/data',
    requirePermission(PERMISSIONS.PROJECTS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { lastSync } = req.query;
            const lastSyncDate = lastSync ? new Date(lastSync as string) : undefined;

            const offlineData = await offlineService.getOfflineData(
                req.user!.id,
                lastSyncDate
            );

            res.json({
                success: true,
                data: offlineData,
                message: 'נתונים לאופליין התקבלו בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting offline data', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתונים לאופליין',
                code: 'OFFLINE_DATA_ERROR'
            });
        }
    })
);

// Sync offline changes
router.post('/sync',
    requirePermission(PERMISSIONS.PROJECTS_EDIT),
    validate({
        body: {
            type: 'object',
            required: ['deviceId', 'changes'],
            properties: {
                deviceId: { type: 'string' },
                changes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['id', 'type', 'entity', 'entityId', 'data', 'timestamp'],
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string', enum: ['create', 'update', 'delete'] },
                            entity: { type: 'string', enum: ['project', 'sheet', 'user'] },
                            entityId: { type: 'string' },
                            data: { type: 'object' },
                            timestamp: { type: 'string', format: 'date-time' },
                            deviceId: { type: 'string' }
                        }
                    }
                }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { deviceId, changes } = req.body;

            // Validate and process changes
            const processedChanges = changes.map((change: any) => ({
                ...change,
                timestamp: new Date(change.timestamp),
                userId: req.user!.id,
                deviceId,
                resolved: false
            }));

            const syncResult = await offlineService.syncOfflineChanges(
                req.user!.id,
                deviceId,
                processedChanges
            );

            res.json({
                success: true,
                data: syncResult,
                message: 'סנכרון אופליין הושלם בהצלחה'
            });
        } catch (error) {
            logger.error('Error syncing offline changes', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בסנכרון אופליין',
                code: 'OFFLINE_SYNC_ERROR'
            });
        }
    })
);

// Get sync operations
router.get('/operations',
    requirePermission(PERMISSIONS.PROJECTS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const operations = offlineService.getSyncOperations(req.user!.id);

            res.json({
                success: true,
                data: operations,
                message: 'פעולות סנכרון התקבלו בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting sync operations', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת פעולות סנכרון',
                code: 'SYNC_OPERATIONS_ERROR'
            });
        }
    })
);

// Get conflicts
router.get('/conflicts',
    requirePermission(PERMISSIONS.PROJECTS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const conflicts = offlineService.getConflicts(req.user!.id);

            res.json({
                success: true,
                data: conflicts,
                message: 'קונפליקטים התקבלו בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting conflicts', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת קונפליקטים',
                code: 'CONFLICTS_ERROR'
            });
        }
    })
);

// Resolve conflict
router.post('/conflicts/:conflictId/resolve',
    requirePermission(PERMISSIONS.PROJECTS_EDIT),
    validate({
        body: {
            type: 'object',
            required: ['resolution'],
            properties: {
                resolution: { type: 'string', enum: ['server', 'client', 'merge'] },
                resolvedData: { type: 'object' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { conflictId } = req.params;
            const { resolution, resolvedData } = req.body;

            const success = await offlineService.resolveConflict(
                req.user!.id,
                conflictId,
                resolution,
                resolvedData
            );

            if (success) {
                res.json({
                    success: true,
                    message: 'קונפליקט נפתר בהצלחה'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'שגיאה בפתרון קונפליקט',
                    code: 'CONFLICT_RESOLUTION_ERROR'
                });
            }
        } catch (error) {
            logger.error('Error resolving conflict', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בפתרון קונפליקט',
                code: 'CONFLICT_RESOLUTION_ERROR'
            });
        }
    })
);

// Check sync status
router.get('/status',
    requirePermission(PERMISSIONS.PROJECTS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const operations = offlineService.getSyncOperations(req.user!.id);
            const conflicts = offlineService.getConflicts(req.user!.id);

            const status = {
                hasUnsyncedOperations: operations.some(op => !op.resolved),
                pendingConflicts: conflicts.length,
                lastSyncTime: operations.length > 0
                    ? Math.max(...operations.map(op => op.timestamp.getTime()))
                    : null,
                totalOperations: operations.length,
                resolvedOperations: operations.filter(op => op.resolved).length
            };

            res.json({
                success: true,
                data: status,
                message: 'סטטוס סנכרון התקבל בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting sync status', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטוס סנכרון',
                code: 'SYNC_STATUS_ERROR'
            });
        }
    })
);

// Force sync
router.post('/force-sync',
    requirePermission(PERMISSIONS.PROJECTS_EDIT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            // Get all pending operations
            const operations = offlineService.getSyncOperations(req.user!.id);
            const pendingOperations = operations.filter(op => !op.resolved);

            if (pendingOperations.length === 0) {
                return res.json({
                    success: true,
                    message: 'אין פעולות ממתינות לסנכרון'
                });
            }

            // Force sync all pending operations
            const syncResult = await offlineService.syncOfflineChanges(
                req.user!.id,
                'force-sync',
                pendingOperations
            );

            res.json({
                success: true,
                data: syncResult,
                message: 'סנכרון כפוי הושלם'
            });
        } catch (error) {
            logger.error('Error in force sync', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בסנכרון כפוי',
                code: 'FORCE_SYNC_ERROR'
            });
        }
    })
);

// Clear sync history
router.delete('/history',
    requirePermission(PERMISSIONS.PROJECTS_EDIT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            // Clear all sync operations for user
            offlineService.getSyncOperations(req.user!.id).length = 0;

            // Clear all conflicts for user
            offlineService.getConflicts(req.user!.id).length = 0;

            res.json({
                success: true,
                message: 'היסטוריית סנכרון נמחקה בהצלחה'
            });
        } catch (error) {
            logger.error('Error clearing sync history', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת היסטוריית סנכרון',
                code: 'CLEAR_HISTORY_ERROR'
            });
        }
    })
);

export default router;

