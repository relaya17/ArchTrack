/**
 * Push Notification Routes
 * Construction Master App - Mobile Push Notifications API
 */

import express from 'express';
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { rateLimiters } from '../middleware/security';
import { asyncHandler } from '../middleware/errorHandler';
import pushNotificationService from '../services/pushNotificationService';
import User from '../models/User';
import logger from '../config/logger';

const router = express.Router();

// Rate limiting for push notification endpoints
router.use(rateLimiters.general);

// Authentication required for all routes
router.use(authenticateToken);

// Register device token
router.post('/register',
    validate({
        body: {
            type: 'object',
            required: ['deviceToken', 'deviceType'],
            properties: {
                deviceToken: { type: 'string' },
                deviceType: { type: 'string', enum: ['ios', 'android', 'web'] },
                deviceName: { type: 'string' },
                appVersion: { type: 'string' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { deviceToken, deviceType, deviceName, appVersion } = req.body;
            const userId = req.user!.id;

            // Validate device token
            const isValidToken = await pushNotificationService.validateDeviceToken(deviceToken);
            if (!isValidToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Device token לא תקין',
                    code: 'INVALID_DEVICE_TOKEN'
                });
            }

            // Update user with device token
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Add device token if not already exists
            if (!user.deviceTokens) {
                user.deviceTokens = [];
            }

            const existingTokenIndex = user.deviceTokens.findIndex(
                (token: any) => token.token === deviceToken
            );

            const deviceInfo = {
                token: deviceToken,
                type: deviceType,
                name: deviceName || 'Unknown Device',
                appVersion: appVersion || '1.0.0',
                registeredAt: new Date(),
                lastUsed: new Date(),
            };

            if (existingTokenIndex >= 0) {
                // Update existing token
                user.deviceTokens[existingTokenIndex] = deviceInfo;
            } else {
                // Add new token
                user.deviceTokens.push(deviceInfo);
            }

            await user.save();

            logger.info('Device token registered successfully', {
                userId,
                deviceType,
                deviceName,
                tokenPrefix: deviceToken.substring(0, 20) + '...'
            });

            res.json({
                success: true,
                message: 'Device token נרשם בהצלחה'
            });
        } catch (error) {
            logger.error('Error registering device token', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום device token',
                code: 'DEVICE_TOKEN_REGISTRATION_ERROR'
            });
        }
    })
);

// Unregister device token
router.delete('/unregister',
    validate({
        body: {
            type: 'object',
            required: ['deviceToken'],
            properties: {
                deviceToken: { type: 'string' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { deviceToken } = req.body;
            const userId = req.user!.id;

            // Remove device token from user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                });
            }

            if (user.deviceTokens) {
                user.deviceTokens = user.deviceTokens.filter(
                    (token: any) => token.token !== deviceToken
                );
                await user.save();
            }

            logger.info('Device token unregistered successfully', {
                userId,
                tokenPrefix: deviceToken.substring(0, 20) + '...'
            });

            res.json({
                success: true,
                message: 'Device token הוסר בהצלחה'
            });
        } catch (error) {
            logger.error('Error unregistering device token', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בהסרת device token',
                code: 'DEVICE_TOKEN_UNREGISTRATION_ERROR'
            });
        }
    })
);

// Get user's device tokens
router.get('/devices',
    requirePermission(PERMISSIONS.PROFILE_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const user = await User.findById(req.user!.id).select('deviceTokens');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                });
            }

            const devices = (user.deviceTokens || []).map((device: any) => ({
                id: device.token.substring(0, 20) + '...',
                type: device.type,
                name: device.name,
                appVersion: device.appVersion,
                registeredAt: device.registeredAt,
                lastUsed: device.lastUsed
            }));

            res.json({
                success: true,
                data: devices,
                message: 'רשימת מכשירים התקבלה בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting user devices', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת רשימת מכשירים',
                code: 'GET_DEVICES_ERROR'
            });
        }
    })
);

// Subscribe to topic
router.post('/subscribe',
    validate({
        body: {
            type: 'object',
            required: ['topic'],
            properties: {
                topic: { type: 'string' },
                deviceToken: { type: 'string' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { topic, deviceToken } = req.body;

            const success = await pushNotificationService.subscribeToTopic(deviceToken, topic);

            if (success) {
                res.json({
                    success: true,
                    message: 'נרשמת בהצלחה לנושא'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'שגיאה ברישום לנושא',
                    code: 'TOPIC_SUBSCRIPTION_ERROR'
                });
            }
        } catch (error) {
            logger.error('Error subscribing to topic', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום לנושא',
                code: 'TOPIC_SUBSCRIPTION_ERROR'
            });
        }
    })
);

// Unsubscribe from topic
router.delete('/unsubscribe',
    validate({
        body: {
            type: 'object',
            required: ['topic'],
            properties: {
                topic: { type: 'string' },
                deviceToken: { type: 'string' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { topic, deviceToken } = req.body;

            const success = await pushNotificationService.unsubscribeFromTopic(deviceToken, topic);

            if (success) {
                res.json({
                    success: true,
                    message: 'הסרת הרשמה מנושא הושלמה בהצלחה'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'שגיאה בהסרת הרשמה מנושא',
                    code: 'TOPIC_UNSUBSCRIPTION_ERROR'
                });
            }
        } catch (error) {
            logger.error('Error unsubscribing from topic', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בהסרת הרשמה מנושא',
                code: 'TOPIC_UNSUBSCRIPTION_ERROR'
            });
        }
    })
);

// Send test notification
router.post('/test',
    requirePermission(PERMISSIONS.ADMIN),
    validate({
        body: {
            type: 'object',
            required: ['title', 'body'],
            properties: {
                title: { type: 'string' },
                body: { type: 'string' },
                deviceToken: { type: 'string' },
                data: { type: 'object' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { title, body, deviceToken, data } = req.body;

            const success = await pushNotificationService.sendToDevice(
                deviceToken,
                { title, body },
                data
            );

            if (success) {
                res.json({
                    success: true,
                    message: 'התראה נשלחה בהצלחה'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'שגיאה בשליחת התראה',
                    code: 'TEST_NOTIFICATION_ERROR'
                });
            }
        } catch (error) {
            logger.error('Error sending test notification', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בשליחת התראה',
                code: 'TEST_NOTIFICATION_ERROR'
            });
        }
    })
);

// Send notification to project team
router.post('/project/:projectId',
    requirePermission(PERMISSIONS.PROJECTS_EDIT),
    validate({
        body: {
            type: 'object',
            required: ['title', 'body'],
            properties: {
                title: { type: 'string' },
                body: { type: 'string' },
                data: { type: 'object' },
                sound: { type: 'string' },
                badge: { type: 'number' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params;
            const { title, body, data, sound, badge } = req.body;

            const result = await pushNotificationService.sendToProjectTeam(
                projectId,
                {
                    title,
                    body,
                    sound,
                    badge,
                    data: {
                        ...data,
                        projectId,
                        senderId: req.user!.id
                    }
                }
            );

            res.json({
                success: true,
                data: result,
                message: 'התראות נשלחו לצוות הפרויקט'
            });
        } catch (error) {
            logger.error('Error sending notification to project team', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בשליחת התראות לצוות',
                code: 'PROJECT_NOTIFICATION_ERROR'
            });
        }
    })
);

// Send notification to user
router.post('/user/:userId',
    requirePermission(PERMISSIONS.ADMIN),
    validate({
        body: {
            type: 'object',
            required: ['title', 'body'],
            properties: {
                title: { type: 'string' },
                body: { type: 'string' },
                data: { type: 'object' },
                sound: { type: 'string' },
                badge: { type: 'number' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params;
            const { title, body, data, sound, badge } = req.body;

            const success = await pushNotificationService.sendToUser(
                userId,
                {
                    title,
                    body,
                    sound,
                    badge,
                    data: {
                        ...data,
                        senderId: req.user!.id
                    }
                }
            );

            if (success) {
                res.json({
                    success: true,
                    message: 'התראה נשלחה למשתמש'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'שגיאה בשליחת התראה למשתמש',
                    code: 'USER_NOTIFICATION_ERROR'
                });
            }
        } catch (error) {
            logger.error('Error sending notification to user', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בשליחת התראה למשתמש',
                code: 'USER_NOTIFICATION_ERROR'
            });
        }
    })
);

// Get notification preferences
router.get('/preferences',
    requirePermission(PERMISSIONS.PROFILE_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const user = await User.findById(req.user!.id).select('notificationPreferences');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                });
            }

            const preferences = user.notificationPreferences || {
                projectUpdates: true,
                teamMessages: true,
                systemAlerts: true,
                reminders: true,
                marketing: false,
                sound: true,
                vibration: true
            };

            res.json({
                success: true,
                data: preferences,
                message: 'העדפות התראות התקבלו בהצלחה'
            });
        } catch (error) {
            logger.error('Error getting notification preferences', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת העדפות התראות',
                code: 'GET_PREFERENCES_ERROR'
            });
        }
    })
);

// Update notification preferences
router.put('/preferences',
    requirePermission(PERMISSIONS.PROFILE_EDIT),
    validate({
        body: {
            type: 'object',
            properties: {
                projectUpdates: { type: 'boolean' },
                teamMessages: { type: 'boolean' },
                systemAlerts: { type: 'boolean' },
                reminders: { type: 'boolean' },
                marketing: { type: 'boolean' },
                sound: { type: 'boolean' },
                vibration: { type: 'boolean' }
            }
        }
    }),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const preferences = req.body;
            const user = await User.findById(req.user!.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                });
            }

            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...preferences
            };

            await user.save();

            res.json({
                success: true,
                data: user.notificationPreferences,
                message: 'העדפות התראות עודכנו בהצלחה'
            });
        } catch (error) {
            logger.error('Error updating notification preferences', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון העדפות התראות',
                code: 'UPDATE_PREFERENCES_ERROR'
            });
        }
    })
);

export default router;

