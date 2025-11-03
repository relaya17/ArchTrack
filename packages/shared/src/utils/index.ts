// Shared utilities for Construction Excel Pro

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS'
    }).format(amount);
};

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

export const calculateProgress = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
};
