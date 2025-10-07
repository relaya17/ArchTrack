// Shared validation schemas for Construction Excel Pro
import { z } from 'zod';

export const userSchema = z.object({
    email: z.string().email('כתובת אימייל לא תקינה'),
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
    role: z.enum(['admin', 'manager', 'engineer', 'contractor'])
});

export const projectSchema = z.object({
    name: z.string().min(3, 'שם הפרויקט חייב להכיל לפחות 3 תווים'),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'completed', 'on-hold']),
    startDate: z.date(),
    endDate: z.date().optional(),
    budget: z.number().positive('תקציב חייב להיות חיובי')
});

export const sheetSchema = z.object({
    name: z.string().min(1, 'שם הגיליון לא יכול להיות ריק'),
    type: z.enum(['boq', 'materials', 'schedule', 'costs']),
    data: z.record(z.any())
});
