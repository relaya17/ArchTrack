/**
 * Offline Context
 * Construction Master App - Mobile Offline Support
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

interface SheetSummary {
  id: string;
  projectId: string;
  name: string;
  type: string;
}

interface FileUploadItem {
  uri: string;
  name: string;
  type: string;
}

interface OfflineMessage {
  id: string;
  projectId: string;
  userId: string;
  message: string;
  createdAt: string;
}

interface PendingChange {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Record<string, unknown>;
}

interface OfflineData {
  projects: ProjectSummary[];
  sheets: SheetSummary[];
  files: FileUploadItem[];
  messages: OfflineMessage[];
  lastSync: Date;
}

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  offlineData: OfflineData;
  syncData: () => Promise<void>;
  saveOfflineData: (type: keyof OfflineData, data: OfflineData[keyof OfflineData]) => Promise<void>;
  getOfflineData: <K extends keyof OfflineData>(type: K) => Promise<OfflineData[K]>;
  clearOfflineData: () => Promise<void>;
  syncPendingChanges: () => Promise<void>;
  getPendingChanges: () => Promise<PendingChange[]>;
  markAsSynced: (id: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    projects: [],
    sheets: [],
    files: [],
    messages: [],
    lastSync: new Date(),
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setIsOfflineMode(!state.isConnected);
    });

    loadOfflineData();

    return () => unsubscribe();
  }, []);

  const loadOfflineData = async () => {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        setOfflineData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async (type: keyof OfflineData, data: OfflineData[keyof OfflineData]): Promise<void> => {
    try {
      const newOfflineData = { ...offlineData };
      (newOfflineData as OfflineData)[type] = data as never;
      newOfflineData.lastSync = new Date();
      
      await AsyncStorage.setItem('offlineData', JSON.stringify(newOfflineData));
      setOfflineData(newOfflineData);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const getOfflineData = async <K extends keyof OfflineData>(type: K): Promise<OfflineData[K]> => {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        const parsedData = JSON.parse(data) as OfflineData;
        return (parsedData[type] ?? []) as OfflineData[K];
      }
      return ([] as unknown) as OfflineData[K];
    } catch (error) {
      console.error('Error getting offline data:', error);
      return [];
    }
  };

  const syncData = async (): Promise<void> => {
    if (!isOnline) {
      Alert.alert('שגיאה', 'אין חיבור לאינטרנט');
      return;
    }

    try {
      // Sync projects
      const projects = await getOfflineData('projects');
      for (const project of projects) {
        await syncProject(project);
      }

      // Sync sheets
      const sheets = await getOfflineData('sheets');
      for (const sheet of sheets) {
        await syncSheet(sheet);
      }

      // Sync files
      const files = await getOfflineData('files');
      for (const file of files) {
        await syncFile(file);
      }

      // Sync messages
      const messages = await getOfflineData('messages');
      for (const message of messages) {
        await syncMessage(message);
      }

      // Clear offline data after successful sync
      await clearOfflineData();
      
      Alert.alert('הצלחה', 'הנתונים סונכרנו בהצלחה');
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('שגיאה', 'שגיאה בסנכרון הנתונים');
    }
  };

  const syncProject = async (project: ProjectSummary): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to sync project');
      }
    } catch (error) {
      console.error('Error syncing project:', error);
      throw error;
    }
  };

  const syncSheet = async (sheet: SheetSummary): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sheet),
      });

      if (!response.ok) {
        throw new Error('Failed to sync sheet');
      }
    } catch (error) {
      console.error('Error syncing sheet:', error);
      throw error;
    }
  };

  const syncFile = async (file: FileUploadItem): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      // @ts-expect-error React Native FormData accepts file-like objects
      formData.append('file', file);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to sync file');
      }
    } catch (error) {
      console.error('Error syncing file:', error);
      throw error;
    }
  };

  const syncMessage = async (message: OfflineMessage): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to sync message');
      }
    } catch (error) {
      console.error('Error syncing message:', error);
      throw error;
    }
  };

  const clearOfflineData = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('offlineData');
      setOfflineData({
        projects: [],
        sheets: [],
        files: [],
        messages: [],
        lastSync: new Date(),
      });
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  const syncPendingChanges = async (): Promise<void> => {
    try {
      const pendingChanges = await getPendingChanges();
      
      for (const change of pendingChanges) {
        try {
          await syncPendingChange(change);
          await markAsSynced(change.id);
        } catch (error) {
          console.error('Error syncing pending change:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  };

  const getPendingChanges = async (): Promise<PendingChange[]> => {
    try {
      const data = await AsyncStorage.getItem('pendingChanges');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending changes:', error);
      return [];
    }
  };

  const markAsSynced = async (id: string): Promise<void> => {
    try {
      const pendingChanges = await getPendingChanges();
      const updatedChanges = pendingChanges.filter(change => change.id !== id);
      await AsyncStorage.setItem('pendingChanges', JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  };

  const syncPendingChange = async (change: PendingChange): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${change.endpoint}`, {
        method: change.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(change.data),
      });

      if (!response.ok) {
        throw new Error('Failed to sync pending change');
      }
    } catch (error) {
      console.error('Error syncing pending change:', error);
      throw error;
    }
  };

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode,
    offlineData,
    syncData,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncPendingChanges,
    getPendingChanges,
    markAsSynced,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
