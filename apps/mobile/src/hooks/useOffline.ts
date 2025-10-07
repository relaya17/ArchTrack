/**
 * Offline Hook
 * Construction Master App - Mobile Offline Support
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

interface ProjectData {
  _id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SheetData {
  _id: string;
  name: string;
  projectId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OfflineData {
  projects: ProjectData[];
  sheets: SheetData[];
  users: UserData[];
  lastSync: Date;
  version: string;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  deviceId: string;
  resolved: boolean;
}

interface ConflictData {
  entityId: string;
  entity: string;
  serverVersion: Record<string, unknown>;
  clientVersion: Record<string, unknown>;
  resolution: 'server' | 'client' | 'merge';
  resolvedData?: Record<string, unknown>;
}

interface SyncResult {
  success: SyncOperation[];
  conflicts: ConflictData[];
  errors: { operation: SyncOperation; error: string }[];
}

interface OfflineStatus {
  isOnline: boolean;
  hasUnsyncedData: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  conflicts: number;
}

const OFFLINE_STORAGE_KEY = 'offline_data';
const SYNC_OPERATIONS_KEY = 'sync_operations';
const DEVICE_ID_KEY = 'device_id';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token, user } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Generate or get device ID
  useEffect(() => {
    const getDeviceId = async () => {
      try {
        let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!storedDeviceId) {
          storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
        }
        setDeviceId(storedDeviceId);
      } catch (error) {
        console.error('Error getting device ID:', error);
      }
    };
    getDeviceId();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);

      // Auto-sync when coming back online
      if (state.isConnected && syncOperations.length > 0) {
        syncOfflineChanges();
      }
    });

    return () => unsubscribe();
  }, [syncOperations.length]);

  // Load offline data on mount
  useEffect(() => {
    if (user && token) {
      loadOfflineData();
      loadSyncOperations();
    }
  }, [user, token]);

  // Load offline data from storage
  const loadOfflineData = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setOfflineData({
          ...parsedData,
          lastSync: new Date(parsedData.lastSync),
        });
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Load sync operations from storage
  const loadSyncOperations = useCallback(async () => {
    try {
      const storedOperations = await AsyncStorage.getItem(SYNC_OPERATIONS_KEY);
      if (storedOperations) {
        const parsedOperations = JSON.parse(storedOperations);
        setSyncOperations(parsedOperations.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error loading sync operations:', error);
    }
  }, []);

  // Save offline data to storage
  const saveOfflineData = useCallback(async (data: OfflineData) => {
    try {
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data));
      setOfflineData(data);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, []);

  // Save sync operations to storage
  const saveSyncOperations = useCallback(async (operations: SyncOperation[]) => {
    try {
      await AsyncStorage.setItem(SYNC_OPERATIONS_KEY, JSON.stringify(operations));
      setSyncOperations(operations);
    } catch (error) {
      console.error('Error saving sync operations:', error);
    }
  }, []);

  // Fetch offline data from server
  const fetchOfflineData = useCallback(async (lastSync?: Date): Promise<OfflineData | null> => {
    if (!token || !isOnline) return null;

    try {
      setIsLoading(true);
      setError(null);

      const apiBase = (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:3016' : 'http://localhost:3016') : 'https://your.api');
      const response = await fetch(`${apiBase}/api/offline/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        ...(lastSync && {
          body: JSON.stringify({ lastSync: lastSync.toISOString() }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch offline data');
      }

      const result = await response.json();
      if (result.success) {
        await saveOfflineData(result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, isOnline, saveOfflineData]);

  // Add sync operation
  const addSyncOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    entity: string,
    entityId: string,
    data: any
  ) => {
    if (!deviceId) return;

    const operation: SyncOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      entityId,
      data,
      timestamp: new Date(),
      deviceId,
      resolved: false,
    };

    const newOperations = [...syncOperations, operation];
    saveSyncOperations(newOperations);
  }, [deviceId, syncOperations, saveSyncOperations]);

  // Sync offline changes with server
  const syncOfflineChanges = useCallback(async (): Promise<SyncResult | null> => {
    if (!token || !isOnline || !deviceId || syncOperations.length === 0) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const pendingOperations = syncOperations.filter(op => !op.resolved);

      const apiBase = (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:3016' : 'http://localhost:3016') : 'https://your.api');
      const response = await fetch(`${apiBase}/api/offline/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          changes: pendingOperations,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync offline changes');
      }

      const result = await response.json();
      if (result.success) {
        // Mark successful operations as resolved
        const updatedOperations = syncOperations.map(op => {
          const successOp = result.data.success.find((sop: SyncOperation) => sop.id === op.id);
          if (successOp) {
            return { ...op, resolved: true };
          }
          return op;
        });

        saveSyncOperations(updatedOperations);

        // Handle conflicts
        if (result.data.conflicts.length > 0) {
          console.warn('Sync conflicts detected:', result.data.conflicts);
        }

        return result.data;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, isOnline, deviceId, syncOperations, saveSyncOperations]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'server' | 'client' | 'merge',
    resolvedData?: any
  ): Promise<boolean> => {
    if (!token || !isOnline) return false;

    try {
      const apiBase = (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:3016' : 'http://localhost:3016') : 'https://your.api');
      const response = await fetch(`${apiBase}/api/offline/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution,
          resolvedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve conflict');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  }, [token, isOnline]);

  // Force sync all pending operations
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (!token || !isOnline) return false;

    try {
      setIsLoading(true);
      setError(null);

      const apiBase = (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:3016' : 'http://localhost:3016') : 'https://your.api');
      const response = await fetch(`${apiBase}/api/offline/force-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to force sync');
      }

      const result = await response.json();
      if (result.success) {
        // Clear all resolved operations
        const unresolvedOperations = syncOperations.filter(op => !op.resolved);
        saveSyncOperations(unresolvedOperations);
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
  }, [token, isOnline, syncOperations, saveSyncOperations]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_STORAGE_KEY);
      await AsyncStorage.removeItem(SYNC_OPERATIONS_KEY);
      setOfflineData(null);
      setSyncOperations([]);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, []);

  // Get offline status
  const getOfflineStatus = useCallback((): OfflineStatus => {
    const pendingOperations = syncOperations.filter(op => !op.resolved).length;
    const lastSyncTime = offlineData?.lastSync || null;

    return {
      isOnline,
      hasUnsyncedData: pendingOperations > 0,
      lastSyncTime,
      pendingOperations,
      conflicts: 0, // This would be populated from conflict resolution
    };
  }, [isOnline, syncOperations, offlineData]);

  // Check if data is available offline
  const isDataAvailableOffline = useCallback((entityType: string, entityId?: string): boolean => {
    if (!offlineData) return false;

    switch (entityType) {
      case 'project':
        return entityId
          ? offlineData.projects.some(p => p._id === entityId)
          : offlineData.projects.length > 0;
      case 'sheet':
        return entityId
          ? offlineData.sheets.some(s => s._id === entityId)
          : offlineData.sheets.length > 0;
      case 'user':
        return entityId
          ? offlineData.users.some(u => u._id === entityId)
          : offlineData.users.length > 0;
      default:
        return false;
    }
  }, [offlineData]);

  // Get offline entity
  const getOfflineEntity = useCallback((entityType: string, entityId: string): any => {
    if (!offlineData) return null;

    switch (entityType) {
      case 'project':
        return offlineData.projects.find(p => p._id === entityId);
      case 'sheet':
        return offlineData.sheets.find(s => s._id === entityId);
      case 'user':
        return offlineData.users.find(u => u._id === entityId);
      default:
        return null;
    }
  }, [offlineData]);

  // Get all offline entities of a type
  const getOfflineEntities = useCallback((entityType: string): any[] => {
    if (!offlineData) return [];

    switch (entityType) {
      case 'project':
        return offlineData.projects;
      case 'sheet':
        return offlineData.sheets;
      case 'user':
        return offlineData.users;
      default:
        return [];
    }
  }, [offlineData]);

  return {
    // State
    isOnline,
    offlineData,
    syncOperations,
    isLoading,
    error,
    deviceId,

    // Actions
    fetchOfflineData,
    addSyncOperation,
    syncOfflineChanges,
    resolveConflict,
    forceSync,
    clearOfflineData,

    // Utilities
    getOfflineStatus,
    isDataAvailableOffline,
    getOfflineEntity,
    getOfflineEntities,

    // Status
    hasUnsyncedData: syncOperations.some(op => !op.resolved),
    pendingOperationsCount: syncOperations.filter(op => !op.resolved).length,
  };
};

