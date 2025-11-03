/**
 * Validation Middleware
 * Construction Master App - Input Validation & Sanitization
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Generic validation middleware
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate request body, query, and params
            const data = {
                body: req.body,
                query: req.query,
                params: req.params
            }

            const validatedData = schema.parse(data)

            // Replace original data with validated data
            req.body = validatedData.body || req.body
            req.query = validatedData.query || req.query
            req.params = validatedData.params || req.params

            next()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    received: (err as any).received
                }))

                return res.status(400).json({
                    success: false,
                    message: 'נתונים לא תקינים',
                    errors: errorMessages
                })
            }

            next(error)
        }
    }
}

// Basic XSS sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
            // Basic XSS protection
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<[^>]*>/g, '')
                .trim()
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize)
        }

        if (obj && typeof obj === 'object') {
            const sanitized: any = {}
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitize(value)
            }
            return sanitized
        }

        return obj
    }

    req.body = sanitize(req.body)
    req.query = sanitize(req.query)
    req.params = sanitize(req.params)

    next()
}

// Common schemas
export const commonSchemas = {
    objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה לא תקין'),
    email: z.string().email('כתובת אימייל לא תקינה'),
    password: z.string().min(8, 'סיסמה חייבת להכיל לפחות 8 תווים').max(100, 'סיסמה ארוכה מדי'),
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100, 'שם ארוך מדי'),
    phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, 'מספר טלפון לא תקין').optional(),
    url: z.string().url('כתובת URL לא תקינה').optional()
}

// Authentication schemas
export const authSchemas = {
    login: z.object({
        body: z.object({
            email: commonSchemas.email,
            password: z.string().min(1, 'סיסמה נדרשת')
        })
    }),

    register: z.object({
        body: z.object({
            name: commonSchemas.name,
            email: commonSchemas.email,
            password: commonSchemas.password,
            role: z.enum(['admin', 'project_manager', 'architect', 'engineer', 'contractor', 'viewer']).optional(),
            phone: commonSchemas.phone
        })
    }),

    changePassword: z.object({
        body: z.object({
            currentPassword: z.string().min(1, 'סיסמה נוכחית נדרשת'),
            newPassword: commonSchemas.password
        })
    }),

    forgotPassword: z.object({
        body: z.object({
            email: commonSchemas.email
        })
    }),

    resetPassword: z.object({
        body: z.object({
            token: z.string().min(1, 'טוקן איפוס נדרש'),
            password: commonSchemas.password
        })
    })
}

// Project schemas
export const projectSchemas = {
    create: z.object({
        body: z.object({
            name: z.string().min(3, 'שם פרויקט חייב להכיל לפחות 3 תווים').max(100, 'שם פרויקט ארוך מדי'),
            description: z.string().max(500, 'תיאור ארוך מדי').optional(),
            client: z.string().min(2, 'שם לקוח חייב להכיל לפחות 2 תווים').max(100, 'שם לקוח ארוך מדי').optional(),
            address: z.string().min(5, 'כתובת חייבת להכיל לפחות 5 תווים').max(200, 'כתובת ארוכה מדי').optional(),
            startDate: z.string().datetime('תאריך התחלה לא תקין'),
            endDate: z.string().datetime('תאריך סיום לא תקין').optional(),
            budget: z.number().min(0, 'תקציב לא יכול להיות שלילי').optional(),
            currency: z.enum(['ILS', 'USD', 'EUR', 'GBP']).optional(),
            status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
            tags: z.array(z.string().max(50)).max(20).optional(),
            location: z.object({
                address: z.string().max(200).optional(),
                city: z.string().max(100).optional(),
                coordinates: z.object({
                    lat: z.number().min(-90).max(90),
                    lng: z.number().min(-180).max(180)
                }).optional()
            }).optional()
        })
    }),

    update: z.object({
        params: z.object({
            id: commonSchemas.objectId
        }),
        body: z.object({
            name: z.string().min(3).max(100).optional(),
            description: z.string().max(500).optional(),
            client: z.string().min(2).max(100).optional(),
            address: z.string().min(5).max(200).optional(),
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
            budget: z.number().min(0).optional(),
            currency: z.enum(['ILS', 'USD', 'EUR', 'GBP']).optional(),
            status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
            tags: z.array(z.string().max(50)).max(20).optional(),
            location: z.object({
                address: z.string().max(200).optional(),
                city: z.string().max(100).optional(),
                coordinates: z.object({
                    lat: z.number().min(-90).max(90),
                    lng: z.number().min(-180).max(180)
                }).optional()
            }).optional()
        })
    }),

    getById: z.object({
        params: z.object({
            id: commonSchemas.objectId
        })
    }),

    list: z.object({
        query: z.object({
            page: z.coerce.number().min(1).optional(),
            limit: z.coerce.number().min(1).max(100).optional(),
            status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
            search: z.string().max(100).optional(),
            sort: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional()
        })
    })
}

// Sheet schemas
export const sheetSchemas = {
    create: z.object({
        body: z.object({
            name: z.string().min(1, 'שם גיליון נדרש').max(100, 'שם גיליון ארוך מדי'),
            description: z.string().max(500, 'תיאור ארוך מדי').optional(),
            projectId: commonSchemas.objectId,
            columns: z.array(z.string().max(50)).min(1, 'חובה לפחות עמודה אחת').max(50, 'יותר מדי עמודות').optional(),
            rows: z.number().min(1).max(10000).optional()
        })
    }),

    update: z.object({
        params: z.object({
            id: commonSchemas.objectId
        }),
        body: z.object({
            name: z.string().min(1).max(100).optional(),
            description: z.string().max(500).optional(),
            columns: z.array(z.string().max(50)).min(1).max(50).optional(),
            rows: z.number().min(1).max(10000).optional()
        })
    }),

    getById: z.object({
        params: z.object({
            id: commonSchemas.objectId
        })
    }),

    list: z.object({
        query: z.object({
            projectId: commonSchemas.objectId.optional(),
            page: z.coerce.number().min(1).optional(),
            limit: z.coerce.number().min(1).max(100).optional(),
            search: z.string().max(100).optional(),
            sort: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional()
        })
    }),

    updateCell: z.object({
        params: z.object({
            id: commonSchemas.objectId
        }),
        body: z.object({
            row: z.number().min(0).max(9999),
            col: z.number().min(0).max(49),
            value: z.union([z.string(), z.number(), z.boolean()]).optional(),
            style: z.object({
                backgroundColor: z.string().optional(),
                color: z.string().optional(),
                fontWeight: z.enum(['normal', 'bold']).optional(),
                textAlign: z.enum(['left', 'center', 'right']).optional()
            }).optional()
        })
    }),

    batchUpdate: z.object({
        params: z.object({
            id: commonSchemas.objectId
        }),
        body: z.object({
            updates: z.array(z.object({
                row: z.number().min(0).max(9999),
                col: z.number().min(0).max(49),
                value: z.union([z.string(), z.number(), z.boolean()]).optional(),
                style: z.object({
                    backgroundColor: z.string().optional(),
                    color: z.string().optional(),
                    fontWeight: z.enum(['normal', 'bold']).optional(),
                    textAlign: z.enum(['left', 'center', 'right']).optional()
                }).optional()
            })).max(100) // Limit batch size
        })
    })
}

// File schemas
export const fileSchemas = {
    upload: z.object({
        params: z.object({
            projectId: commonSchemas.objectId
        }),
        body: z.object({
            category: z.enum(['drawing', 'document', 'image', 'video', 'general', 'other']).optional(),
            description: z.string().max(500).optional(),
            tags: z.array(z.string().max(50)).max(10).optional()
        })
    }),

    uploadMultiple: z.object({
        params: z.object({
            projectId: commonSchemas.objectId
        }),
        body: z.object({
            category: z.enum(['drawing', 'document', 'image', 'video', 'general', 'other']).optional()
        })
    }),

    getById: z.object({
        params: z.object({
            id: commonSchemas.objectId
        })
    }),

    list: z.object({
        query: z.object({
            projectId: commonSchemas.objectId.optional(),
            category: z.enum(['drawing', 'document', 'image', 'video', 'general', 'other']).optional(),
            page: z.coerce.number().min(1).optional(),
            limit: z.coerce.number().min(1).max(100).optional(),
            sort: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional()
        })
    }),

    update: z.object({
        params: z.object({
            id: commonSchemas.objectId
        }),
        body: z.object({
            description: z.string().max(500).optional(),
            tags: z.array(z.string().max(50)).max(10).optional(),
            category: z.enum(['drawing', 'document', 'image', 'video', 'general', 'other']).optional()
        })
    })
}

// AI schemas
export const aiSchemas = {
    chat: z.object({
        body: z.object({
            message: z.string().min(1, 'הודעה נדרשת').max(2000, 'הודעה ארוכה מדי'),
            assistantType: z.enum(['construction_assistant', 'data_analyst', 'cost_estimator', 'safety_advisor']).optional(),
            projectId: commonSchemas.objectId.optional(),
            sheetId: commonSchemas.objectId.optional()
        })
    }),

    analyzeProject: z.object({
        body: z.object({
            projectId: commonSchemas.objectId
        })
    }),

    clearHistory: z.object({
        body: z.object({
            assistantType: z.enum(['construction_assistant', 'data_analyst', 'cost_estimator', 'safety_advisor']).optional()
        })
    }),

    getHistory: z.object({
        query: z.object({
            assistantType: z.enum(['construction_assistant', 'data_analyst', 'cost_estimator', 'safety_advisor']).optional(),
            page: z.coerce.number().min(1).optional(),
            limit: z.coerce.number().min(1).max(100).optional()
        })
    })
}

// Analytics schemas
export const analyticsSchemas = {
    getTrends: z.object({
        query: z.object({
            period: z.enum(['7d', '30d', '90d', '12m']).optional(),
            granularity: z.enum(['daily', 'weekly', 'monthly']).optional()
        })
    }),

    exportData: z.object({
        body: z.object({
            format: z.enum(['json', 'csv', 'xlsx']).optional(),
            filters: z.object({
                dateRange: z.object({
                    startDate: z.string().datetime().optional(),
                    endDate: z.string().datetime().optional()
                }).optional(),
                projectIds: z.array(commonSchemas.objectId).optional(),
                categories: z.array(z.string()).optional()
            }).optional()
        })
    }),

    customReport: z.object({
        body: z.object({
            filters: z.object({
                dateRange: z.object({
                    startDate: z.string().datetime(),
                    endDate: z.string().datetime()
                }).optional(),
                projectIds: z.array(commonSchemas.objectId).optional(),
                userIds: z.array(commonSchemas.objectId).optional()
            }).optional(),
            sections: z.array(z.string()).max(20).optional()
        })
    }),

    getProjectAnalytics: z.object({
        params: z.object({
            projectId: commonSchemas.objectId
        })
    })
}

export default {
    validate,
    sanitizeInput,
    commonSchemas,
    authSchemas,
    projectSchemas,
    sheetSchemas,
    fileSchemas,
    aiSchemas,
    analyticsSchemas
}
