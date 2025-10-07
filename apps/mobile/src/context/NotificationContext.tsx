/**
 * Notification Context
 * Construction Master App - Mobile Push Notifications
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'project' | 'sheet' | 'file' | 'message' | 'system';
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  registerForPushNotifications: () => Promise<string | null>;
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationSettings: () => Promise<any>;
  updateNotificationSettings: (settings: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    setupNotificationListeners();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await AsyncStorage.getItem('notifications');
      if (data) {
        const parsedNotifications = JSON.parse(data).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(parsedNotifications);
        updateUnreadCount(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for incoming notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const newNotification: Notification = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        type: notification.request.content.data?.type || 'system',
        priority: notification.request.content.data?.priority || 'medium',
        read: false,
        timestamp: new Date(),
      };
      
      addNotification(newNotification);
    });

    // Listen for notification responses
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      markAsRead(notificationId);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        Alert.alert('שגיאה', 'התקן פיזי נדרש לקבלת התראות');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('שגיאה', 'הרשאות התראות נדרשות');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Save token to server
      await saveTokenToServer(token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  const saveTokenToServer = async (token: string) => {
    try {
      const userToken = await AsyncStorage.getItem('authToken');
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
    } catch (error) {
      console.error('Error saving token to server:', error);
    }
  };

  const sendNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>): Promise<void> => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      // Schedule local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: null, // Show immediately
      });

      addNotification(newNotification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const addNotification = async (notification: Notification) => {
    try {
      const updatedNotifications = [notification, ...notifications];
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = async (id: string): Promise<void> => {
    try {
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const updateUnreadCount = (notifications: Notification[]) => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const getNotificationSettings = async (): Promise<any> => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : {
        pushEnabled: true,
        emailEnabled: true,
        projectUpdates: true,
        sheetUpdates: true,
        fileUpdates: true,
        messageUpdates: true,
        systemUpdates: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  };

  const updateNotificationSettings = async (settings: any): Promise<void> => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    registerForPushNotifications,
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    getNotificationSettings,
    updateNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
