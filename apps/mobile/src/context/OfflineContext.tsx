import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OfflineData {
  projects: Project[]
  sheets: Sheet[]
  files: File[]
  messages: Message[]
  lastSync: Date
}

interface PendingChange {
  id: string
  endpoint: string
  method: string
  data: any
  timestamp: Date
  retryCount: number
}

interface OfflineContextType {
  isOnline: boolean
  isOfflineMode: boolean
  offlineData: OfflineData
  pendingChanges: PendingChange[]
  syncData: () => Promise<void>
  saveOfflineData: (type: keyof OfflineData, data: any[]) => Promise<void>
  getOfflineData: (type: keyof OfflineData) => Promise<any[]>
  clearOfflineData: () => Promise<void>
  syncPendingChanges: () => Promise<void>
  getPendingChanges: () => Promise<PendingChange[]>
  markAsSynced: (id: string) => Promise<void>
  addPendingChange: (change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>
  getOfflineStatus: () => Promise<{
    lastSync: Date | null
    pendingChanges: number
    dataSize: number
  }>
}

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'paused'
  startDate: Date
  endDate: Date
  budget: number
  progress: number
  createdAt: Date
  updatedAt: Date
}

interface Sheet {
  id: string
  projectId: string
  name: string
  type: 'boq' | 'schedule' | 'budget' | 'resource'
  data: any
  createdAt: Date
  updatedAt: Date
}

interface File {
  id: string
  projectId: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: Date
}

interface Message {
  id: string
  projectId: string
  userId: string
  content: string
  timestamp: Date
  type: 'text' | 'file' | 'system'
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

interface OfflineProviderProps {
  children: ReactNode
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [offlineData, setOfflineData] = useState<OfflineData>({
    projects: [],
    sheets: [],
    files: [],
    messages: [],
    lastSync: new Date()
  })
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false)
      setIsOfflineMode(!state.isConnected)
    })

    return () => unsubscribe()
  }, [])

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData()
    loadPendingChanges()
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncPendingChanges()
    }
  }, [isOnline, pendingChanges.length])

  const loadOfflineData = async () => {
    try {
      const data = await AsyncStorage.getItem('offlineData')
      if (data) {
        const parsed = JSON.parse(data)
        setOfflineData({
          ...parsed,
          lastSync: new Date(parsed.lastSync)
        })
      }
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }

  const loadPendingChanges = async () => {
    try {
      const changes = await AsyncStorage.getItem('pendingChanges')
      if (changes) {
        const parsed = JSON.parse(changes)
        setPendingChanges(parsed.map((change: any) => ({
          ...change,
          timestamp: new Date(change.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading pending changes:', error)
    }
  }

  const saveOfflineData = async (type: keyof OfflineData, data: any[]) => {
    try {
      const newOfflineData = {
        ...offlineData,
        [type]: data,
        lastSync: new Date()
      }
      
      setOfflineData(newOfflineData)
      await AsyncStorage.setItem('offlineData', JSON.stringify(newOfflineData))
    } catch (error) {
      console.error('Error saving offline data:', error)
    }
  }

  const getOfflineData = async (type: keyof OfflineData): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem('offlineData')
      if (data) {
        const parsed = JSON.parse(data)
        return parsed[type] || []
      }
      return []
    } catch (error) {
      console.error('Error getting offline data:', error)
      return []
    }
  }

  const clearOfflineData = async () => {
    try {
      setOfflineData({
        projects: [],
        sheets: [],
        files: [],
        messages: [],
        lastSync: new Date()
      })
      await AsyncStorage.removeItem('offlineData')
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }

  const syncData = async () => {
    if (!isOnline) {
      throw new Error('No internet connection')
    }

    try {
      // Sync projects
      const projects = await getOfflineData('projects')
      if (projects.length > 0) {
        // API call to sync projects
        console.log('Syncing projects:', projects.length)
      }

      // Sync sheets
      const sheets = await getOfflineData('sheets')
      if (sheets.length > 0) {
        // API call to sync sheets
        console.log('Syncing sheets:', sheets.length)
      }

      // Sync files
      const files = await getOfflineData('files')
      if (files.length > 0) {
        // API call to sync files
        console.log('Syncing files:', files.length)
      }

      // Sync messages
      const messages = await getOfflineData('messages')
      if (messages.length > 0) {
        // API call to sync messages
        console.log('Syncing messages:', messages.length)
      }

      // Update last sync time
      await saveOfflineData('projects', projects)
    } catch (error) {
      console.error('Error syncing data:', error)
      throw error
    }
  }

  const addPendingChange = async (change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
    try {
      const newChange: PendingChange = {
        ...change,
        id: Date.now().toString(),
        timestamp: new Date(),
        retryCount: 0
      }

      const updatedChanges = [...pendingChanges, newChange]
      setPendingChanges(updatedChanges)
      await AsyncStorage.setItem('pendingChanges', JSON.stringify(updatedChanges))
    } catch (error) {
      console.error('Error adding pending change:', error)
    }
  }

  const syncPendingChanges = async () => {
    if (!isOnline || pendingChanges.length === 0) return

    try {
      const successfulChanges: string[] = []
      
      for (const change of pendingChanges) {
        try {
          // Simulate API call
          console.log(`Syncing change: ${change.method} ${change.endpoint}`)
          
          // Mark as successful
          successfulChanges.push(change.id)
        } catch (error) {
          console.error(`Failed to sync change ${change.id}:`, error)
          
          // Increment retry count
          const updatedChange = { ...change, retryCount: change.retryCount + 1 }
          const updatedChanges = pendingChanges.map(c => 
            c.id === change.id ? updatedChange : c
          )
          setPendingChanges(updatedChanges)
          await AsyncStorage.setItem('pendingChanges', JSON.stringify(updatedChanges))
        }
      }

      // Remove successful changes
      if (successfulChanges.length > 0) {
        const remainingChanges = pendingChanges.filter(c => !successfulChanges.includes(c.id))
        setPendingChanges(remainingChanges)
        await AsyncStorage.setItem('pendingChanges', JSON.stringify(remainingChanges))
      }
    } catch (error) {
      console.error('Error syncing pending changes:', error)
    }
  }

  const getPendingChanges = async (): Promise<PendingChange[]> => {
    return pendingChanges
  }

  const markAsSynced = async (id: string) => {
    try {
      const updatedChanges = pendingChanges.filter(change => change.id !== id)
      setPendingChanges(updatedChanges)
      await AsyncStorage.setItem('pendingChanges', JSON.stringify(updatedChanges))
    } catch (error) {
      console.error('Error marking change as synced:', error)
    }
  }

  const getOfflineStatus = async () => {
    try {
      const data = await AsyncStorage.getItem('offlineData')
      const changes = await AsyncStorage.getItem('pendingChanges')
      
      let lastSync: Date | null = null
      let dataSize = 0
      
      if (data) {
        const parsed = JSON.parse(data)
        lastSync = new Date(parsed.lastSync)
        dataSize = JSON.stringify(parsed).length
      }
      
      const pendingCount = changes ? JSON.parse(changes).length : 0
      
      return {
        lastSync,
        pendingChanges: pendingCount,
        dataSize
      }
    } catch (error) {
      console.error('Error getting offline status:', error)
      return {
        lastSync: null,
        pendingChanges: 0,
        dataSize: 0
      }
    }
  }

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode,
    offlineData,
    pendingChanges,
    syncData,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncPendingChanges,
    getPendingChanges,
    markAsSynced,
    addPendingChange,
    getOfflineStatus
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}