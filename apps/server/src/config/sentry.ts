/**
 * Sentry Configuration
 * Construction Master App - Error Tracking & Performance Monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
export const initSentry = () => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',

            // Performance monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

            // Integrations
            integrations: [
                // HTTP integration for Express
                Sentry.httpIntegration({
                    instrumentOutgoingRequests: true,
                }),

                // Node.js profiling integration
                nodeProfilingIntegration(),

                // Console integration
                Sentry.consoleIntegration(),

                // OnUncaughtException integration
                Sentry.onUncaughtExceptionIntegration(),

                // OnUnhandledRejection integration
                Sentry.onUnhandledRejectionIntegration(),
            ],

            // Release tracking
            release: process.env.npm_package_version || '1.0.0',

            // Server name
            serverName: process.env.HOSTNAME || 'probuilder-server',

            // Tags
            initialScope: {
                tags: {
                    component: 'server',
                    version: process.env.npm_package_version || '1.0.0',
                },
            },

            // Before send hook
            beforeSend(event, hint) {
                // Filter out certain errors
                if (event.exception) {
                    const error = hint.originalException;

                    // Don't report certain types of errors
                    if (error instanceof Error) {
                        if (error.message.includes('ECONNREFUSED')) {
                            return null;
                        }
                        if (error.message.includes('ENOTFOUND')) {
                            return null;
                        }
                    }
                }

                // Add custom tags
                event.tags = {
                    ...event.tags,
                    environment: process.env.NODE_ENV,
                    timestamp: new Date().toISOString(),
                };

                return event;
            },

            // Before send transaction hook
            beforeSendTransaction(event) {
                // Filter out health check requests
                if (event.transaction === 'GET /health') {
                    return null;
                }

                return event;
            },

            // Error sample rate
            sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

            // Max breadcrumbs
            maxBreadcrumbs: 50,

            // Attach stack traces
            attachStacktrace: true,

            // Send default PII
            sendDefaultPii: false,

            // Debug mode
            debug: process.env.NODE_ENV === 'development',
        });

        console.log('✅ Sentry initialized successfully');
    } else {
        console.log('⚠️ Sentry DSN not provided, skipping initialization');
    }
};

// Custom Sentry utilities
export const captureException = (error: Error, context?: any) => {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setContext('additional_info', context);
        }
        Sentry.captureException(error);
    });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: any) => {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setContext('additional_info', context);
        }
        scope.setLevel(level);
        Sentry.captureMessage(message);
    });
};

export const captureUser = (user: any) => {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
    });
};

export const captureTransaction = (name: string, op: string) => {
    return Sentry.startSpan({
        name,
        op,
    }, () => { });
};

export const captureBreadcrumb = (message: string, category: string, data?: any) => {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000,
    });
};

export const setTag = (key: string, value: string) => {
    Sentry.setTag(key, value);
};

export const setContext = (key: string, context: any) => {
    Sentry.setContext(key, context);
};

export const flush = async () => {
    await Sentry.flush(2000);
};

export default Sentry;

