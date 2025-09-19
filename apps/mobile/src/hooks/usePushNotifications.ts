/**
 * Push Notifications Hook
 * Construction Master App - Mobile Push Notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

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

interface NotificationPreferences {
  projectUpdates: boolean;
  teamMessages: boolean;
  systemAlerts: boolean;
  reminders: boolean;
  marketing: boolean;
  sound: boolean;
  vibration: boolean;
}

interface DeviceInfo {
  token: string;
  type: 'ios' | 'android';
  name: string;
  appVersion: string;
  registeredAt: Date;
  lastUsed: Date;
}

const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences';
const DEVICE_TOKEN_KEY = 'device_token';

export const usePushNotifications = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    projectUpdates: true,
    teamMessages: true,
    systemAlerts: true,
    reminders: true,
    marketing: false,
    sound: true,
    vibration: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token, user } = useAuth();

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'הרשאות התראות',
            message: 'האפליקציה רוצה לשלוח לך התראות על עדכוני פרויקטים',
            buttonNeutral: 'שאל מאוחר יותר',
            buttonNegative: 'בטל',
            buttonPositive: 'אשר',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setPermissionGranted(enabled);
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setError('שגיאה בבקשת הרשאות התראות');
      return false;
    }
  }, []);

  // Get device token
  const getDeviceToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await messaging().getToken();
      setDeviceToken(token);
      return token;
    } catch (error) {
      console.error('Error getting device token:', error);
      setError('שגיאה בקבלת device token');
      return null;
    }
  }, []);

  // Register device with server
  const registerDevice = useCallback(async (): Promise<boolean> => {
    if (!deviceToken || !token || !user) return false;

    try {
      setIsLoading(true);
      setError(null);

      const deviceInfo: DeviceInfo = {
        token: deviceToken,
        type: Platform.OS === 'ios' ? 'ios' : 'android',
        name: `${Platform.OS} Device`,
        appVersion: '1.0.0', // You might want to get this from package.json
        registeredAt: new Date(),
        lastUsed: new Date(),
      };

      const response = await fetch('/api/push-notifications/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceInfo),
      });

      if (!response.ok) {
        throw new Error('Failed to register device');
      }

      const result = await response.json();
      if (result.success) {
        setIsRegistered(true);
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceToken, token, user]);

  // Unregister device from server
  const unregisterDevice = useCallback(async (): Promise<boolean> => {
    if (!deviceToken || !token) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/push-notifications/unregister', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to unregister device');
      }

      const result = await response.json();
      if (result.success) {
        setIsRegistered(false);
        await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceToken, token]);

  // Subscribe to topic
  const subscribeToTopic = useCallback(async (topic: string): Promise<boolean> => {
    if (!deviceToken || !token) return false;

    try {
      const response = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, deviceToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to topic');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }, [deviceToken, token]);

  // Unsubscribe from topic
  const unsubscribeFromTopic = useCallback(async (topic: string): Promise<boolean> => {
    if (!deviceToken || !token) return false;

    try {
      const response = await fetch('/api/push-notifications/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, deviceToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe from topic');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }, [deviceToken, token]);

  // Get notification preferences
  const getNotificationPreferences = useCallback(async (): Promise<NotificationPreferences | null> => {
    if (!token) return null;

    try {
      const response = await fetch('/api/push-notifications/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get notification preferences');
      }

      const result = await response.json();
      if (result.success) {
        setPreferences(result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }, [token]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (
    newPreferences: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    if (!token) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/push-notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const result = await response.json();
      if (result.success) {
        setPreferences(result.data);
        await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(result.data));
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!deviceToken || !token) return false;

    try {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'בדיקת התראה',
          body: 'זוהי התראה לבדיקה',
          deviceToken,
          data: { type: 'test' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }, [deviceToken, token]);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: any) => {
    console.log('Notification pressed:', notification);
    
    // Handle different notification types
    if (notification.data) {
      const { type, projectId, sheetId } = notification.data;
      
      switch (type) {
        case 'project_update':
          // Navigate to project
          console.log('Navigate to project:', projectId);
          break;
        case 'team_message':
          // Navigate to chat
          console.log('Navigate to chat');
          break;
        case 'reminder':
          // Show reminder details
          Alert.alert('תזכורת', notification.body);
          break;
        default:
          // Handle general notification
          Alert.alert(notification.title, notification.body);
      }
    }
  }, []);

  // Handle background notification
  const handleBackgroundNotification = useCallback((message: any) => {
    console.log('Background notification received:', message);
    
    // Update app badge count
    if (message.notification?.badge) {
      // You might want to update your app's badge count here
    }
  }, []);

  // Initialize push notifications
  const initializePushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('הרשאות התראות נדחו');
        return false;
      }

      // Get device token
      const token = await getDeviceToken();
      if (!token) {
        setError('לא ניתן לקבל device token');
        return false;
      }

      // Register device
      const registered = await registerDevice();
      if (!registered) {
        setError('שגיאה ברישום המכשיר');
        return false;
      }

      // Load preferences
      await getNotificationPreferences();

      // Subscribe to default topics
      await subscribeToTopic('all_users');
      if (user?.role === 'admin') {
        await subscribeToTopic('admins');
      }

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setError('שגיאה באתחול התראות');
      return false;
    }
  }, [requestPermissions, getDeviceToken, registerDevice, getNotificationPreferences, subscribeToTopic, user]);

  // Setup notification listeners
  useEffect(() => {
    if (!isRegistered) return;

    // Handle foreground notifications
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      
      // Show local notification or update UI
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'התראה',
          remoteMessage.notification.body || '',
          [
            {
              text: 'סגור',
              style: 'cancel',
            },
            {
              text: 'פתח',
              onPress: () => handleNotificationPress(remoteMessage),
            },
          ]
        );
      }
    });

    // Handle background notifications
    const unsubscribeBackground = messaging().setBackgroundMessageHandler(handleBackgroundNotification);

    // Handle notification press
    const unsubscribePress = messaging().onNotificationOpenedApp(handleNotificationPress);

    // Handle notification press when app is closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotificationPress(remoteMessage);
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribePress();
    };
  }, [isRegistered, handleNotificationPress, handleBackgroundNotification]);

  // Load stored preferences on mount
  useEffect(() => {
    const loadStoredPreferences = async () => {
      try {
        const storedPreferences = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
        if (storedPreferences) {
          setPreferences(JSON.parse(storedPreferences));
        }
      } catch (error) {
        console.error('Error loading stored preferences:', error);
      }
    };

    loadStoredPreferences();
  }, []);

  // Check if device is registered
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
        if (storedToken && storedToken === deviceToken) {
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
      }
    };

    if (deviceToken) {
      checkRegistrationStatus();
    }
  }, [deviceToken]);

  return {
    // State
    deviceToken,
    permissionGranted,
    isRegistered,
    preferences,
    isLoading,
    error,

    // Actions
    requestPermissions,
    getDeviceToken,
    registerDevice,
    unregisterDevice,
    subscribeToTopic,
    unsubscribeFromTopic,
    getNotificationPreferences,
    updateNotificationPreferences,
    sendTestNotification,
    initializePushNotifications,

    // Utilities
    handleNotificationPress,
    handleBackgroundNotification,
  };
};

