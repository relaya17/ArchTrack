/**
 * Push Notification Service
 * Construction Master App - Mobile Push Notifications
 */

import admin from 'firebase-admin';
import logger from '../config/logger';
import { businessMetrics } from '../config/metrics';
import User from '../models/User';
import Project from '../models/Project';

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
  clickAction?: string;
  category?: string;
  tag?: string;
}

interface NotificationPayload {
  notification: PushNotificationData;
  data?: Record<string, string>;
  android?: {
    notification: {
      sound?: string;
      priority?: 'min' | 'low' | 'default' | 'high' | 'max';
      defaultSound?: boolean;
      defaultVibrateTimings?: boolean;
      defaultLightSettings?: boolean;
      icon?: string;
      color?: string;
      tag?: string;
      clickAction?: string;
    };
    priority?: 'normal' | 'high';
    ttl?: number;
  };
  apns?: {
    payload: {
      aps: {
        alert: {
          title: string;
          body: string;
        };
        sound?: string;
        badge?: number;
        category?: string;
        'thread-id'?: string;
        'content-available'?: number;
      };
    };
    headers?: {
      'apns-priority': string;
      'apns-expiration': string;
    };
  };
  webpush?: {
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      timestamp?: number;
    };
    headers?: Record<string, string>;
  };
}

class PushNotificationService {
  private isInitialized = false;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
          });
          this.isInitialized = true;
          logger.info('Firebase Admin SDK initialized successfully');
        } else {
          logger.warn('Firebase service account key not provided, push notifications disabled');
        }
      } else {
        this.isInitialized = true;
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send push notification to specific device
   */
  async sendToDevice(
    deviceToken: string,
    notification: PushNotificationData,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      const payload: NotificationPayload = {
        notification,
        data,
        android: {
          notification: {
            sound: notification.sound || 'default',
            priority: 'high',
            icon: 'ic_notification',
            color: '#2196F3',
            tag: notification.tag,
            clickAction: notification.clickAction,
          },
          priority: 'high',
          ttl: 24 * 60 * 60 * 1000, // 24 hours
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: notification.sound || 'default',
              badge: notification.badge,
              category: notification.category,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': Math.floor(Date.now() / 1000 + 24 * 60 * 60).toString(),
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: notification.tag,
            requireInteraction: false,
            timestamp: Date.now(),
          },
        },
      };

      const result = await admin.messaging().send({
        token: deviceToken,
        ...payload,
      });

      // Record metrics
      businessMetrics.apiCallsTotal.inc({
        endpoint: 'push-notifications/send',
        method: 'FIREBASE',
      });

      logger.info('Push notification sent successfully', {
        messageId: result,
        deviceToken: deviceToken.substring(0, 20) + '...',
      });

      return true;
    } catch (error) {
      logger.error('Failed to send push notification', error);
      businessMetrics.errorsTotal.inc({
        type: 'push_notification_error',
        severity: 'medium',
      });
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    notification: PushNotificationData,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return { successCount: 0, failureCount: deviceTokens.length };
    }

    try {
      const payload: NotificationPayload = {
        notification,
        data,
        android: {
          notification: {
            sound: notification.sound || 'default',
            priority: 'high',
            icon: 'ic_notification',
            color: '#2196F3',
            tag: notification.tag,
            clickAction: notification.clickAction,
          },
          priority: 'high',
          ttl: 24 * 60 * 60 * 1000, // 24 hours
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: notification.sound || 'default',
              badge: notification.badge,
              category: notification.category,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': Math.floor(Date.now() / 1000 + 24 * 60 * 60).toString(),
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: notification.tag,
            requireInteraction: false,
            timestamp: Date.now(),
          },
        },
      };

      const result = await admin.messaging().sendMulticast({
        tokens: deviceTokens,
        ...payload,
      });

      // Record metrics
      businessMetrics.apiCallsTotal.inc({
        endpoint: 'push-notifications/send-multiple',
        method: 'FIREBASE',
      });

      businessMetrics.pushNotificationsTotal.inc({
        type: 'multicast',
      }, result.successCount);

      logger.info('Multicast push notification sent', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalTokens: deviceTokens.length,
      });

      // Log failed tokens for debugging
      if (result.failureCount > 0) {
        result.responses.forEach((response, index) => {
          if (!response.success) {
            logger.warn('Failed to send to token', {
              token: deviceTokens[index].substring(0, 20) + '...',
              error: response.error?.message,
            });
          }
        });
      }

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      logger.error('Failed to send multicast push notification', error);
      businessMetrics.errorsTotal.inc({
        type: 'push_notification_error',
        severity: 'high',
      });
      return { successCount: 0, failureCount: deviceTokens.length };
    }
  }

  /**
   * Send push notification to user
   */
  async sendToUser(
    userId: string,
    notification: PushNotificationData,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
        logger.warn('User not found or has no device tokens', { userId });
        return false;
      }

      const result = await this.sendToMultipleDevices(user.deviceTokens, notification, data);
      return result.successCount > 0;
    } catch (error) {
      logger.error('Failed to send push notification to user', error);
      return false;
    }
  }

  /**
   * Send push notification to project team
   */
  async sendToProjectTeam(
    projectId: string,
    notification: PushNotificationData,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        logger.warn('Project not found', { projectId });
        return { successCount: 0, failureCount: 0 };
      }

      // Get all team members' device tokens
      const teamMemberIds = [
        project.ownerId.toString(),
        ...project.teamMembers.map(member => member.userId.toString()),
      ];

      const users = await User.find({
        _id: { $in: teamMemberIds },
        deviceTokens: { $exists: true, $ne: [] },
      });

      const allDeviceTokens = users.flatMap(user => user.deviceTokens || []);

      if (allDeviceTokens.length === 0) {
        logger.warn('No device tokens found for project team', { projectId });
        return { successCount: 0, failureCount: 0 };
      }

      const result = await this.sendToMultipleDevices(allDeviceTokens, notification, {
        ...data,
        projectId,
      });

      logger.info('Push notification sent to project team', {
        projectId,
        successCount: result.successCount,
        failureCount: result.failureCount,
        teamSize: users.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to send push notification to project team', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send push notification to topic subscribers
   */
  async sendToTopic(
    topic: string,
    notification: PushNotificationData,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      const payload: NotificationPayload = {
        notification,
        data,
        android: {
          notification: {
            sound: notification.sound || 'default',
            priority: 'high',
            icon: 'ic_notification',
            color: '#2196F3',
            tag: notification.tag,
            clickAction: notification.clickAction,
          },
          priority: 'high',
          ttl: 24 * 60 * 60 * 1000, // 24 hours
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: notification.sound || 'default',
              badge: notification.badge,
              category: notification.category,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-expiration': Math.floor(Date.now() / 1000 + 24 * 60 * 60).toString(),
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: notification.tag,
            requireInteraction: false,
            timestamp: Date.now(),
          },
        },
      };

      const result = await admin.messaging().send({
        topic,
        ...payload,
      });

      // Record metrics
      businessMetrics.apiCallsTotal.inc({
        endpoint: 'push-notifications/send-topic',
        method: 'FIREBASE',
      });

      businessMetrics.pushNotificationsTotal.inc({
        type: 'topic',
      });

      logger.info('Push notification sent to topic', {
        topic,
        messageId: result,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send push notification to topic', error);
      businessMetrics.errorsTotal.inc({
        type: 'push_notification_error',
        severity: 'medium',
      });
      return false;
    }
  }

  /**
   * Subscribe user to topic
   */
  async subscribeToTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      await admin.messaging().subscribeToTopic([deviceToken], topic);

      logger.info('Device subscribed to topic', {
        topic,
        deviceToken: deviceToken.substring(0, 20) + '...',
      });

      return true;
    } catch (error) {
      logger.error('Failed to subscribe device to topic', error);
      return false;
    }
  }

  /**
   * Unsubscribe user from topic
   */
  async unsubscribeFromTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      await admin.messaging().unsubscribeFromTopic([deviceToken], topic);

      logger.info('Device unsubscribed from topic', {
        topic,
        deviceToken: deviceToken.substring(0, 20) + '...',
      });

      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe device from topic', error);
      return false;
    }
  }

  /**
   * Validate device token
   */
  async validateDeviceToken(deviceToken: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Try to send a test message (silent)
      await admin.messaging().send({
        token: deviceToken,
        data: {
          type: 'validation',
          timestamp: Date.now().toString(),
        },
      });

      return true;
    } catch (error) {
      logger.warn('Device token validation failed', {
        deviceToken: deviceToken.substring(0, 20) + '...',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceAvailable(): boolean {
    return this.isInitialized;
  }
}

export default new PushNotificationService();

