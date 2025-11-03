/**
 * קבועים למערכת הבנייה
 * Construction Master App - Constants
 */

// הגדרות מערכת
export const APP_CONFIG = {
    name: 'ProBuilder',
    version: '1.0.0',
    description: 'מערכת גיליונות חכמה מקצועית לענף הבנייה והאדריכלות',
    author: 'Construction Master Team',
    website: 'https://probuilder.app',
    support: 'support@probuilder.app',
} as const

// API endpoints
export const API_ENDPOINTS = {
    // Authentication
    auth: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        register: '/api/auth/register',
        me: '/api/auth/me',
        refresh: '/api/auth/refresh',
    },

    // Projects
    projects: {
        list: '/api/projects',
        create: '/api/projects',
        get: (id: string) => `/api/projects/${id}`,
        update: (id: string) => `/api/projects/${id}`,
        delete: (id: string) => `/api/projects/${id}`,
    },

    // Sheets
    sheets: {
        list: (projectId: string) => `/api/projects/${projectId}/sheets`,
        create: '/api/sheets',
        get: (id: string) => `/api/sheets/${id}`,
        update: (id: string) => `/api/sheets/${id}`,
        delete: (id: string) => `/api/sheets/${id}`,
        import: (id: string) => `/api/sheets/${id}/import`,
        export: (id: string) => `/api/sheets/${id}/export`,
    },

    // Cells
    cells: {
        update: (sheetId: string) => `/api/sheets/${sheetId}/cells`,
        batch: (sheetId: string) => `/api/sheets/${sheetId}/cells/batch`,
    },

    // Files
    files: {
        upload: (projectId: string) => `/api/projects/${projectId}/files`,
        list: (projectId: string) => `/api/projects/${projectId}/files`,
        get: (id: string) => `/api/files/${id}`,
        delete: (id: string) => `/api/files/${id}`,
    },

    // Chat
    chat: {
        messages: (projectId: string) => `/api/projects/${projectId}/chat`,
        send: (projectId: string) => `/api/projects/${projectId}/chat/send`,
    },

    // Analytics
    analytics: {
        kpi: (projectId: string) => `/api/projects/${projectId}/analytics/kpi`,
        predictions: (projectId: string) => `/api/projects/${projectId}/analytics/predictions`,
        risks: (projectId: string) => `/api/projects/${projectId}/analytics/risks`,
    },
} as const

// סוגי משתמשים ותפקידים
export const USER_ROLES = {
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project_manager',
    ARCHITECT: 'architect',
    ENGINEER: 'engineer',
    CONTRACTOR: 'contractor',
    VIEWER: 'viewer',
} as const

export const USER_ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'מנהל מערכת',
    [USER_ROLES.PROJECT_MANAGER]: 'מנהל פרויקט',
    [USER_ROLES.ARCHITECT]: 'אדריכל',
    [USER_ROLES.ENGINEER]: 'מהנדס',
    [USER_ROLES.CONTRACTOR]: 'קבלן',
    [USER_ROLES.VIEWER]: 'צופה',
} as const

// סוגי גיליונות
export const SHEET_TYPES = {
    BOQ: 'boq',
    ESTIMATE: 'estimate',
    SCHEDULE: 'schedule',
    MATERIALS: 'materials',
    COSTS: 'costs',
    DIARY: 'diary',
} as const

export const SHEET_TYPE_LABELS = {
    [SHEET_TYPES.BOQ]: 'BOQ - Bill of Quantities',
    [SHEET_TYPES.ESTIMATE]: 'הערכת עלויות',
    [SHEET_TYPES.SCHEDULE]: 'לוח זמנים',
    [SHEET_TYPES.MATERIALS]: 'חומרים',
    [SHEET_TYPES.COSTS]: 'עלויות',
    [SHEET_TYPES.DIARY]: 'יומן עבודה',
} as const

// סוגי תאים
export const CELL_TYPES = {
    TEXT: 'text',
    NUMBER: 'number',
    CURRENCY: 'currency',
    PERCENTAGE: 'percentage',
    DATE: 'date',
    FORMULA: 'formula',
} as const

export const CELL_TYPE_LABELS = {
    [CELL_TYPES.TEXT]: 'טקסט',
    [CELL_TYPES.NUMBER]: 'מספר',
    [CELL_TYPES.CURRENCY]: 'מטבע',
    [CELL_TYPES.PERCENTAGE]: 'אחוז',
    [CELL_TYPES.DATE]: 'תאריך',
    [CELL_TYPES.FORMULA]: 'נוסחה',
} as const

// קטגוריות חומרים
export const MATERIAL_CATEGORIES = {
    CONCRETE: 'concrete',
    STEEL: 'steel',
    GYPSUM: 'gypsum',
    ELECTRICAL: 'electrical',
    PLUMBING: 'plumbing',
    GENERAL: 'general',
} as const

export const MATERIAL_CATEGORY_LABELS = {
    [MATERIAL_CATEGORIES.CONCRETE]: 'בטון',
    [MATERIAL_CATEGORIES.STEEL]: 'פלדה',
    [MATERIAL_CATEGORIES.GYPSUM]: 'גבס',
    [MATERIAL_CATEGORIES.ELECTRICAL]: 'חשמל',
    [MATERIAL_CATEGORIES.PLUMBING]: 'אינסטלציה',
    [MATERIAL_CATEGORIES.GENERAL]: 'כללי',
} as const

export const MATERIAL_CATEGORY_COLORS = {
    [MATERIAL_CATEGORIES.CONCRETE]: '#3B82F6', // כחול
    [MATERIAL_CATEGORIES.STEEL]: '#10B981',    // ירוק
    [MATERIAL_CATEGORIES.GYPSUM]: '#8B5CF6',   // סגול
    [MATERIAL_CATEGORIES.ELECTRICAL]: '#F59E0B', // צהוב
    [MATERIAL_CATEGORIES.PLUMBING]: '#EF4444',  // אדום
    [MATERIAL_CATEGORIES.GENERAL]: '#6B7280',   // אפור
} as const

// סוגי רכיבי BIM
export const BIM_COMPONENT_TYPES = {
    WALL: 'wall',
    BEAM: 'beam',
    COLUMN: 'column',
    SLAB: 'slab',
    DOOR: 'door',
    WINDOW: 'window',
    ROOF: 'roof',
} as const

export const BIM_COMPONENT_LABELS = {
    [BIM_COMPONENT_TYPES.WALL]: 'קיר',
    [BIM_COMPONENT_TYPES.BEAM]: 'קורה',
    [BIM_COMPONENT_TYPES.COLUMN]: 'עמוד',
    [BIM_COMPONENT_TYPES.SLAB]: 'רצפה',
    [BIM_COMPONENT_TYPES.DOOR]: 'דלת',
    [BIM_COMPONENT_TYPES.WINDOW]: 'חלון',
    [BIM_COMPONENT_TYPES.ROOF]: 'גג',
} as const

export const BIM_COMPONENT_ICONS = {
    [BIM_COMPONENT_TYPES.WALL]: '🧱',
    [BIM_COMPONENT_TYPES.BEAM]: '🏗️',
    [BIM_COMPONENT_TYPES.COLUMN]: '🏛️',
    [BIM_COMPONENT_TYPES.SLAB]: '🏢',
    [BIM_COMPONENT_TYPES.DOOR]: '🚪',
    [BIM_COMPONENT_TYPES.WINDOW]: '🪟',
    [BIM_COMPONENT_TYPES.ROOF]: '🏠',
} as const

// סטטוסי פרויקט
export const PROJECT_STATUS = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
} as const

export const PROJECT_STATUS_LABELS = {
    [PROJECT_STATUS.PLANNING]: 'תכנון',
    [PROJECT_STATUS.ACTIVE]: 'פעיל',
    [PROJECT_STATUS.COMPLETED]: 'הושלם',
    [PROJECT_STATUS.ON_HOLD]: 'מושהה',
} as const

export const PROJECT_STATUS_COLORS = {
    [PROJECT_STATUS.PLANNING]: '#6B7280', // אפור
    [PROJECT_STATUS.ACTIVE]: '#10B981',   // ירוק
    [PROJECT_STATUS.COMPLETED]: '#3B82F6', // כחול
    [PROJECT_STATUS.ON_HOLD]: '#F59E0B',  // צהוב
} as const

// יחידות מידה
export const UNITS = {
    // אורך
    METER: 'm',
    CENTIMETER: 'cm',
    MILLIMETER: 'mm',
    INCH: 'in',
    FOOT: 'ft',

    // שטח
    SQUARE_METER: 'm²',
    SQUARE_CENTIMETER: 'cm²',
    SQUARE_FOOT: 'ft²',

    // נפח
    CUBIC_METER: 'm³',
    CUBIC_CENTIMETER: 'cm³',
    LITER: 'L',

    // משקל
    KILOGRAM: 'kg',
    GRAM: 'g',
    TON: 't',
    POUND: 'lb',

    // זמן
    HOUR: 'hr',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',

    // כמות
    PIECE: 'pcs',
    SET: 'set',
    PACKAGE: 'pkg',
} as const

export const UNIT_LABELS = {
    [UNITS.METER]: 'מטר',
    [UNITS.CENTIMETER]: 'סנטימטר',
    [UNITS.MILLIMETER]: 'מילימטר',
    [UNITS.INCH]: 'אינץ\'',
    [UNITS.FOOT]: 'רגל',
    [UNITS.SQUARE_METER]: 'מטר רבוע',
    [UNITS.SQUARE_CENTIMETER]: 'סנטימטר רבוע',
    [UNITS.SQUARE_FOOT]: 'רגל רבוע',
    [UNITS.CUBIC_METER]: 'מטר מעוקב',
    [UNITS.CUBIC_CENTIMETER]: 'סנטימטר מעוקב',
    [UNITS.LITER]: 'ליטר',
    [UNITS.KILOGRAM]: 'קילוגרם',
    [UNITS.GRAM]: 'גרם',
    [UNITS.TON]: 'טון',
    [UNITS.POUND]: 'פאונד',
    [UNITS.HOUR]: 'שעה',
    [UNITS.DAY]: 'יום',
    [UNITS.WEEK]: 'שבוע',
    [UNITS.MONTH]: 'חודש',
    [UNITS.YEAR]: 'שנה',
    [UNITS.PIECE]: 'יחידה',
    [UNITS.SET]: 'סט',
    [UNITS.PACKAGE]: 'חבילה',
} as const

// מטבעות
export const CURRENCIES = {
    ILS: 'ILS',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
} as const

export const CURRENCY_LABELS = {
    [CURRENCIES.ILS]: 'שקל ישראלי',
    [CURRENCIES.USD]: 'דולר אמריקאי',
    [CURRENCIES.EUR]: 'יורו',
    [CURRENCIES.GBP]: 'לירה שטרלינג',
} as const

export const CURRENCY_SYMBOLS = {
    [CURRENCIES.ILS]: '₪',
    [CURRENCIES.USD]: '$',
    [CURRENCIES.EUR]: '€',
    [CURRENCIES.GBP]: '£',
} as const

// הגדרות UI
export const UI_CONFIG = {
    SIDEBAR_WIDTH: 256,
    HEADER_HEIGHT: 64,
    TOOLBAR_HEIGHT: 48,
    FORMULA_BAR_HEIGHT: 48,
    GRID_ROW_HEIGHT: 32,
    GRID_COLUMN_WIDTH: 120,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
} as const

// הודעות שגיאה
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'שגיאת רשת - בדוק את החיבור לאינטרנט',
    UNAUTHORIZED: 'אין הרשאה לגשת למשאב זה',
    FORBIDDEN: 'פעולה זו אסורה',
    NOT_FOUND: 'המשאב המבוקש לא נמצא',
    VALIDATION_ERROR: 'שגיאת אימות - בדוק את הנתונים שהוזנו',
    SERVER_ERROR: 'שגיאת שרת - נסה שוב מאוחר יותר',
    UNKNOWN_ERROR: 'שגיאה לא ידועה',
} as const

// הודעות הצלחה
export const SUCCESS_MESSAGES = {
    SAVED: 'נשמר בהצלחה',
    CREATED: 'נוצר בהצלחה',
    UPDATED: 'עודכן בהצלחה',
    DELETED: 'נמחק בהצלחה',
    UPLOADED: 'הועלה בהצלחה',
    EXPORTED: 'יוצא בהצלחה',
    IMPORTED: 'יובא בהצלחה',
} as const

// הגדרות WebSocket
export const WEBSOCKET_CONFIG = {
    RECONNECT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000,
} as const

// הגדרות קבצים
export const FILE_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-zip-compressed',
    ],
    ALLOWED_EXTENSIONS: [
        '.pdf',
        '.xls',
        '.xlsx',
        '.csv',
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.zip',
        '.dwg',
        '.dxf',
    ],
} as const
