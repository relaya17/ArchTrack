/**
 * Alerting Configuration
 * Construction Master App - System Alerts & Notifications
 */

import logger from './logger';
import { businessMetrics } from './metrics';
import { captureMessage } from './sentry';

export interface AlertConfig {
    name: string;
    condition: () => boolean | Promise<boolean>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action?: () => void | Promise<void>;
    cooldown?: number; // in milliseconds
}

class AlertManager {
    private alerts: Map<string, AlertConfig> = new Map();
    private lastTriggered: Map<string, number> = new Map();
    private isRunning = false;

    registerAlert(alert: AlertConfig) {
        this.alerts.set(alert.name, alert);
        logger.info(`Alert registered: ${alert.name}`);
    }

    async checkAlerts() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            for (const [name, alert] of this.alerts) {
                await this.checkAlert(name, alert);
            }
        } catch (error) {
            logger.error('Error checking alerts', error);
        } finally {
            this.isRunning = false;
        }
    }

    private async checkAlert(name: string, alert: AlertConfig) {
        try {
            const now = Date.now();
            const lastTriggered = this.lastTriggered.get(name) || 0;

            // Check cooldown
            if (alert.cooldown && (now - lastTriggered) < alert.cooldown) {
                return;
            }

            const shouldTrigger = await alert.condition();

            if (shouldTrigger) {
                await this.triggerAlert(name, alert);
                this.lastTriggered.set(name, now);
            }
        } catch (error) {
            logger.error(`Error checking alert ${name}`, error);
        }
    }

    private async triggerAlert(name: string, alert: AlertConfig) {
        logger.warn(`Alert triggered: ${name}`, {
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString(),
        });

        // Send to Sentry for critical alerts
        if (alert.severity === 'critical' || alert.severity === 'high') {
            captureMessage(
                `Alert: ${alert.message}`,
                alert.severity === 'critical' ? 'fatal' : 'error',
                { alertName: name, severity: alert.severity }
            );
        }

        // Record alert metric
        businessMetrics.errorsTotal.inc({
            type: 'alert_triggered',
            severity: alert.severity,
        });

        // Execute custom action if provided
        if (alert.action) {
            try {
                await alert.action();
            } catch (error) {
                logger.error(`Error executing alert action for ${name}`, error);
            }
        }

        // Send notification (implement based on your needs)
        await this.sendNotification(name, alert);
    }

    private async sendNotification(name: string, alert: AlertConfig) {
        // Implement notification logic here
        // This could be email, Slack, Discord, SMS, etc.

        const notification = {
            alert: name,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        };

        // Example: Send to webhook
        if (process.env.ALERT_WEBHOOK_URL) {
            try {
                const fetch = require('node-fetch');
                await fetch(process.env.ALERT_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(notification),
                });
            } catch (error) {
                logger.error('Failed to send alert notification', error);
            }
        }

        // Example: Send email
        if (process.env.ALERT_EMAIL && alert.severity === 'critical') {
            // Implement email sending logic here
            logger.info(`Critical alert email would be sent: ${alert.message}`);
        }
    }

    start() {
        // Check alerts every 30 seconds
        setInterval(() => {
            this.checkAlerts();
        }, 30000);

        logger.info('Alert manager started');
    }
}

// Create global alert manager instance
export const alertManager = new AlertManager();

// Define common alerts
export const registerCommonAlerts = () => {
    // High memory usage alert
    alertManager.registerAlert({
        name: 'high_memory_usage',
        condition: () => {
            const memUsage = process.memoryUsage();
            const totalMem = require('os').totalmem();
            const freeMem = require('os').freemem();
            const usedMem = totalMem - freeMem;
            const memUsagePercent = (usedMem / totalMem) * 100;
            return memUsagePercent > 85;
        },
        severity: 'high',
        message: 'High memory usage detected',
        cooldown: 300000, // 5 minutes
    });

    // High CPU usage alert
    alertManager.registerAlert({
        name: 'high_cpu_usage',
        condition: () => {
            const cpus = require('os').cpus();
            const cpuUsage = cpus.reduce((acc: number, cpu: any) => {
                const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
                const idle = cpu.times.idle;
                return acc + (1 - idle / total);
            }, 0) / cpus.length * 100;
            return cpuUsage > 90;
        },
        severity: 'medium',
        message: 'High CPU usage detected',
        cooldown: 300000, // 5 minutes
    });

    // Database connection issues
    alertManager.registerAlert({
        name: 'database_connection_issues',
        condition: () => {
            const mongoose = require('mongoose');
            return mongoose.connection.readyState !== 1;
        },
        severity: 'critical',
        message: 'Database connection issues detected',
        cooldown: 60000, // 1 minute
    });

    // High error rate
    alertManager.registerAlert({
        name: 'high_error_rate',
        condition: () => {
            // This would need to be implemented based on your metrics
            // For now, we'll use a placeholder
            return false;
        },
        severity: 'high',
        message: 'High error rate detected',
        cooldown: 300000, // 5 minutes
    });

    // Disk space low
    alertManager.registerAlert({
        name: 'low_disk_space',
        condition: () => {
            try {
                const fs = require('fs');
                const stats = fs.statSync('.');
                // This is a simplified check - implement proper disk space checking
                return false;
            } catch {
                return false;
            }
        },
        severity: 'high',
        message: 'Low disk space detected',
        cooldown: 600000, // 10 minutes
    });

    // Too many failed login attempts
    alertManager.registerAlert({
        name: 'failed_login_attempts',
        condition: () => {
            // This would need to be implemented based on your metrics
            // For now, we'll use a placeholder
            return false;
        },
        severity: 'medium',
        message: 'Multiple failed login attempts detected',
        cooldown: 300000, // 5 minutes
    });

    // Application not responding
    alertManager.registerAlert({
        name: 'application_not_responding',
        condition: () => {
            // This would need to be implemented based on your metrics
            // For now, we'll use a placeholder
            return false;
        },
        severity: 'critical',
        message: 'Application not responding',
        cooldown: 60000, // 1 minute
    });
};

// Start alert manager
export const startAlertManager = () => {
    registerCommonAlerts();
    alertManager.start();
};

export default alertManager;

