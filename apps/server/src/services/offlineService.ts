/**
 * Offline Support Service
 * Construction Master App - Offline Data Synchronization
 */

import logger from '../config/logger';
import { businessMetrics } from '../config/metrics';
import Project from '../models/Project';
import Sheet from '../models/Sheet';
import User from '../models/User';
import mongoose from 'mongoose';

interface OfflineData {
  projects: any[];
  sheets: any[];
  users: any[];
  lastSync: Date;
  version: string;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: Date;
  userId: string;
  deviceId: string;
  resolved: boolean;
  conflictResolution?: 'server' | 'client' | 'merge';
}

interface ConflictResolution {
  entityId: string;
  entity: string;
  serverVersion: any;
  clientVersion: any;
  resolution: 'server' | 'client' | 'merge';
  resolvedData?: any;
  timestamp: Date;
}

class OfflineService {
  private syncOperations: Map<string, SyncOperation[]> = new Map();
  private conflictResolutions: Map<string, ConflictResolution[]> = new Map();

  constructor() {
    this.cleanupOldOperations();
  }

  /**
   * Get offline data for user
   */
  async getOfflineData(userId: string, lastSyncDate?: Date): Promise<OfflineData> {
    try {
      const startTime = Date.now();

      // Get user's accessible projects
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userProjects = await Project.find({
        $or: [
          { ownerId: userId },
          { 'teamMembers.userId': userId },
        ],
        ...(lastSyncDate && { updatedAt: { $gte: lastSyncDate } }),
      }).populate('ownerId', 'name email');

      // Get sheets for user's projects
      const projectIds = userProjects.map(p => p._id);
      const userSheets = await Sheet.find({
        projectId: { $in: projectIds },
        ...(lastSyncDate && { updatedAt: { $gte: lastSyncDate } }),
      });

      // Get team members for projects
      const teamMemberIds = [
        ...new Set(
          userProjects.flatMap(p => [
            p.ownerId.toString(),
            ...p.teamMembers.map(m => m.userId.toString()),
          ])
        ),
      ];

      const teamMembers = await User.find({
        _id: { $in: teamMemberIds },
        ...(lastSyncDate && { updatedAt: { $gte: lastSyncDate } }),
      }).select('name email role avatar');

      const offlineData: OfflineData = {
        projects: userProjects.map(p => this.serializeProject(p)),
        sheets: userSheets.map(s => this.serializeSheet(s)),
        users: teamMembers.map(u => this.serializeUser(u)),
        lastSync: new Date(),
        version: process.env.APP_VERSION || '1.0.0',
      };

      const duration = Date.now() - startTime;

      // Record metrics
      businessMetrics.apiResponseTime.observe(
        { endpoint: '/offline/data', method: 'GET' },
        duration / 1000
      );

      businessMetrics.apiCallsTotal.inc({
        endpoint: '/offline/data',
        method: 'GET',
      });

      logger.info('Offline data generated successfully', {
        userId,
        projectsCount: offlineData.projects.length,
        sheetsCount: offlineData.sheets.length,
        usersCount: offlineData.users.length,
        duration: `${duration}ms`,
      });

      return offlineData;
    } catch (error) {
      logger.error('Failed to get offline data', error);
      businessMetrics.errorsTotal.inc({
        type: 'offline_data_error',
        severity: 'medium',
      });
      throw error;
    }
  }

  /**
   * Sync offline changes
   */
  async syncOfflineChanges(
    userId: string,
    deviceId: string,
    changes: SyncOperation[]
  ): Promise<{
    success: SyncOperation[];
    conflicts: ConflictResolution[];
    errors: { operation: SyncOperation; error: string }[];
  }> {
    try {
      const startTime = Date.now();
      const results = {
        success: [] as SyncOperation[],
        conflicts: [] as ConflictResolution[],
        errors: [] as { operation: SyncOperation; error: string }[],
      };

      // Store operations for tracking
      if (!this.syncOperations.has(userId)) {
        this.syncOperations.set(userId, []);
      }

      for (const operation of changes) {
        try {
          // Check for conflicts
          const conflict = await this.checkForConflicts(operation);
          if (conflict) {
            results.conflicts.push(conflict);
            continue;
          }

          // Apply operation
          const success = await this.applyOperation(operation, userId);
          if (success) {
            operation.resolved = true;
            results.success.push(operation);
            this.syncOperations.get(userId)!.push(operation);
          } else {
            results.errors.push({
              operation,
              error: 'Failed to apply operation',
            });
          }
        } catch (error) {
          results.errors.push({
            operation,
            error: error.message,
          });
        }
      }

      const duration = Date.now() - startTime;

      // Record metrics
      businessMetrics.apiResponseTime.observe(
        { endpoint: '/offline/sync', method: 'POST' },
        duration / 1000
      );

      businessMetrics.apiCallsTotal.inc({
        endpoint: '/offline/sync',
        method: 'POST',
      });

      logger.info('Offline sync completed', {
        userId,
        deviceId,
        totalOperations: changes.length,
        successCount: results.success.length,
        conflictCount: results.conflicts.length,
        errorCount: results.errors.length,
        duration: `${duration}ms`,
      });

      return results;
    } catch (error) {
      logger.error('Failed to sync offline changes', error);
      businessMetrics.errorsTotal.inc({
        type: 'offline_sync_error',
        severity: 'high',
      });
      throw error;
    }
  }

  /**
   * Check for conflicts
   */
  private async checkForConflicts(operation: SyncOperation): Promise<ConflictResolution | null> {
    try {
      let serverVersion: any;

      switch (operation.entity) {
        case 'project':
          serverVersion = await Project.findById(operation.entityId);
          break;
        case 'sheet':
          serverVersion = await Sheet.findById(operation.entityId);
          break;
        default:
          return null;
      }

      if (!serverVersion) {
        return null; // No conflict if server version doesn't exist
      }

      // Check if server version is newer
      const serverUpdatedAt = new Date(serverVersion.updatedAt);
      const clientUpdatedAt = new Date(operation.data.updatedAt || operation.timestamp);

      if (serverUpdatedAt > clientUpdatedAt) {
        return {
          entityId: operation.entityId,
          entity: operation.entity,
          serverVersion: this.serializeEntity(serverVersion, operation.entity),
          clientVersion: operation.data,
          resolution: 'server', // Default to server wins
          timestamp: new Date(),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error checking for conflicts', error);
      return null;
    }
  }

  /**
   * Apply operation
   */
  private async applyOperation(operation: SyncOperation, userId: string): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'create':
          return await this.createEntity(operation, userId);
        case 'update':
          return await this.updateEntity(operation, userId);
        case 'delete':
          return await this.deleteEntity(operation, userId);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error applying operation', error);
      return false;
    }
  }

  /**
   * Create entity
   */
  private async createEntity(operation: SyncOperation, userId: string): Promise<boolean> {
    try {
      const data = {
        ...operation.data,
        _id: new mongoose.Types.ObjectId(operation.entityId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      switch (operation.entity) {
        case 'project':
          const project = new Project(data);
          await project.save();
          break;
        case 'sheet':
          const sheet = new Sheet(data);
          await sheet.save();
          break;
        default:
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Error creating entity', error);
      return false;
    }
  }

  /**
   * Update entity
   */
  private async updateEntity(operation: SyncOperation, userId: string): Promise<boolean> {
    try {
      const data = {
        ...operation.data,
        updatedAt: new Date(),
      };

      switch (operation.entity) {
        case 'project':
          await Project.findByIdAndUpdate(operation.entityId, data);
          break;
        case 'sheet':
          await Sheet.findByIdAndUpdate(operation.entityId, data);
          break;
        default:
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating entity', error);
      return false;
    }
  }

  /**
   * Delete entity
   */
  private async deleteEntity(operation: SyncOperation, userId: string): Promise<boolean> {
    try {
      switch (operation.entity) {
        case 'project':
          await Project.findByIdAndDelete(operation.entityId);
          break;
        case 'sheet':
          await Sheet.findByIdAndDelete(operation.entityId);
          break;
        default:
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting entity', error);
      return false;
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    userId: string,
    conflictId: string,
    resolution: 'server' | 'client' | 'merge',
    resolvedData?: any
  ): Promise<boolean> {
    try {
      // Find the conflict
      let conflict: ConflictResolution | null = null;
      for (const [user, conflicts] of this.conflictResolutions) {
        if (user === userId) {
          conflict = conflicts.find(c => c.entityId === conflictId);
          if (conflict) break;
        }
      }

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      // Apply resolution
      let finalData: any;
      switch (resolution) {
        case 'server':
          finalData = conflict.serverVersion;
          break;
        case 'client':
          finalData = conflict.clientVersion;
          break;
        case 'merge':
          finalData = resolvedData || this.mergeData(conflict.serverVersion, conflict.clientVersion);
          break;
      }

      // Update the entity
      const operation: SyncOperation = {
        id: `resolve-${Date.now()}`,
        type: 'update',
        entity: conflict.entity,
        entityId: conflict.entityId,
        data: finalData,
        timestamp: new Date(),
        userId,
        deviceId: 'conflict-resolution',
        resolved: false,
      };

      const success = await this.applyOperation(operation, userId);

      if (success) {
        // Mark conflict as resolved
        conflict.resolution = resolution;
        conflict.resolvedData = finalData;

        logger.info('Conflict resolved successfully', {
          userId,
          conflictId,
          resolution,
          entity: conflict.entity,
        });
      }

      return success;
    } catch (error) {
      logger.error('Failed to resolve conflict', error);
      return false;
    }
  }

  /**
   * Merge data from server and client versions
   */
  private mergeData(serverData: any, clientData: any): any {
    // Simple merge strategy - prioritize client changes for most fields
    // In a real application, you'd implement more sophisticated merging logic
    return {
      ...serverData,
      ...clientData,
      updatedAt: new Date(),
      _conflictResolved: true,
    };
  }

  /**
   * Serialize project for offline storage
   */
  private serializeProject(project: any): any {
    return {
      _id: project._id.toString(),
      name: project.name,
      description: project.description,
      status: project.status,
      budget: project.budget,
      startDate: project.startDate,
      endDate: project.endDate,
      ownerId: project.ownerId._id ? project.ownerId._id.toString() : project.ownerId.toString(),
      ownerName: project.ownerId.name || '',
      teamMembers: project.teamMembers.map((member: any) => ({
        userId: member.userId.toString(),
        role: member.role,
        permissions: member.permissions,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Serialize sheet for offline storage
   */
  private serializeSheet(sheet: any): any {
    return {
      _id: sheet._id.toString(),
      name: sheet.name,
      type: sheet.type,
      projectId: sheet.projectId.toString(),
      cells: sheet.cells,
      metadata: sheet.metadata,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    };
  }

  /**
   * Serialize user for offline storage
   */
  private serializeUser(user: any): any {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Serialize entity based on type
   */
  private serializeEntity(entity: any, type: string): any {
    switch (type) {
      case 'project':
        return this.serializeProject(entity);
      case 'sheet':
        return this.serializeSheet(entity);
      case 'user':
        return this.serializeUser(entity);
      default:
        return entity.toObject ? entity.toObject() : entity;
    }
  }

  /**
   * Get sync operations for user
   */
  getSyncOperations(userId: string): SyncOperation[] {
    return this.syncOperations.get(userId) || [];
  }

  /**
   * Get conflicts for user
   */
  getConflicts(userId: string): ConflictResolution[] {
    return this.conflictResolutions.get(userId) || [];
  }

  /**
   * Cleanup old operations and conflicts
   */
  private cleanupOldOperations(): void {
    setInterval(() => {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

      // Cleanup old sync operations
      for (const [userId, operations] of this.syncOperations) {
        const filteredOperations = operations.filter(
          op => op.timestamp > cutoffDate
        );
        this.syncOperations.set(userId, filteredOperations);
      }

      // Cleanup old conflicts
      for (const [userId, conflicts] of this.conflictResolutions) {
        const filteredConflicts = conflicts.filter(
          conflict => conflict.timestamp > cutoffDate
        );
        this.conflictResolutions.set(userId, filteredConflicts);
      }

      logger.info('Cleaned up old sync operations and conflicts');
    }, 24 * 60 * 60 * 1000); // Run daily
  }
}

export default new OfflineService();

