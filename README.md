# 🏗️ ProBuilder - Construction Master App

מערכת אינטראקטיבית, חכמה ומקיפה לניהול פרויקטים בענף הבנייה, שמחליפה את קבצי ה-Excel המפוזרים ומביאה את כל אנשי הצוות (אדריכלים, מהנדסים, קבלנים) לפלטפורמה אחת מרכזית.

## 🎯 חזון המוצר

המטרה: חסכון בזמן, ביטול טעויות אנוש, ניהול תקציב אוטומטי, ושיתוף מידע בזמן אמת.

## 👥 קהל יעד

- **אדריכלים** – תכנון, שרטוטים, אישור לקוחות
- **מהנדסי בניין** – חישובים סטטיים, חומרים, בדיקות חוזק
- **קבלנים / מנהלי פרויקטים** – לוחות זמנים, תיאום עובדים, עלויות
- **לקוחות / מפקחים** – סקירה ודוחות בזמן אמת

## 🔥 פיצ'רים פורצי דרך

### 1. ניהול פרויקטים
- יצירה וניהול פרויקטים מרובים
- חלוקה לשלבים: תכנון → ביצוע → מסירה
- AI Scheduler – יצירת לוחות זמנים אוטומטיים
- Budget Optimizer – חישוב עלויות אוטומטי והצעות לחסכון

### 2. Sheets חכמים (Excel 2.0)
- Grid דינמי עם נוסחאות צבעוניות ותנאים מותאמים
- Cell AI Helper – הצעות אוטומטיות לנוסחאות ותיקונים
- Import / Export XLSX, CSV, PDF
- Link בין תאים לשרטוטים / BIM
- History + Undo/Redo לכל תא + Compare גרסאות

### 3. BOQ / Materials / Inventory
- חישוב עלויות חומרי גלם אוטומטי
- Stock tracking – מעקב מלאי בזמן אמת
- התראות על חוסרים או עודפים
- קישור ל-Supplier APIs להזמנות אוטומטיות

### 4. 3D / BIM Integration
- צפה בכל הדגמים של Revit / AutoCAD / IFC ישירות בתוך האפליקציה
- התאמת חלקי פרויקט ל-Sheets ול-BOQ
- Augmented Reality (AR) – להצגת פרויקט באתר באמצעות טאבלט/מובייל

### 5. Collaboration & Chat חכם
- Chat קבוצתי/פרטי בזמן אמת
- תגובות/הערות על תאים, גרפים או שרטוטים
- התראות אוטומטיות על שינויים קריטיים
- AI Assistant שמסכם שיחות ומפיק To-Do אוטומטי

### 6. ניהול משתמשים והרשאות
- Roles: Viewer / Editor / Project Manager / Admin
- SSO / OAuth / Active Directory / Google Login
- Audit log מלא + GDPR/ISO 27001 compliant

### 7. Dashboard & Analytics
- KPI מותאמים אישית: תקציב, עלויות, אבני דרך, אחוזי התקדמות
- Predictive Analytics – ניבוי חריגות עלויות ועיכובים
- Export Reports אוטומטי ל-PDF/Excel/PowerPoint
- Visual graphs / Gantt / Kanban / Calendar

### 8. AI & Automation
- ChatGPT Integration: הסבר שינויים, המלצות אוטומטיות
- Cost Optimizer: חישוב אופטימלי של חומרים, צוות ומשאבים
- Risk Predictor: זיהוי סיכונים בפרויקט על בסיס נתונים היסטוריים
- Automated Compliance Checks (Building codes, Safety regulations)

### 9. Mobile & AR
- רספונסיבי לכל המכשירים
- AR + AR.js: הצגת תוכניות ותלת-ממד באתר הפרויקט
- Push Notifications: התראות קריטיות על חריגות

### 10. Integrations & Cloud
- Cloud storage (AWS, GCP) עם Versioning מלא
- API Integrations: Suppliers, BIM tools, Financial Software
- Realtime sync בין כל המשתמשים

## 🛠 טכנולוגיה

### Frontend
- **React 18** + **Next.js 14** + **TypeScript**
- **TailwindCSS** + **Radix UI** components
- **Framer Motion** לאנימציות
- **Three.js** + **AR.js** ל-3D ו-AR
- **AG Grid** לטבלאות מתקדמות
- **Socket.IO** לשיתוף בזמן אמת

### Backend
- **Node.js** + **Express** / **NestJS**
- **GraphQL** / **REST** APIs
- **PostgreSQL** + **Prisma ORM**
- **Socket.IO** / **WebRTC** לריאל-טיים
- **Redis** ל-caching ו-sessions

### AI & ML
- **OpenAI API** ל-ChatGPT integration
- **ML models** ל-Predictive Analytics
- **Computer Vision** לניתוח שרטוטים

### Cloud & Infrastructure
- **AWS S3** + **CloudFront** לאחסון קבצים
- **AWS Lambda** לפונקציות serverless
- **Docker** + **Kubernetes** לפריסה
- **GitHub Actions** ל-CI/CD

## 🚀 התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### התקנה
```bash
# Clone הפרויקט
git clone <repository-url>
cd construction-excel-pro

# התקנת dependencies
pnpm install

# הגדרת משתני סביבה
cp .env.example .env
# ערוך את .env עם הפרטים שלך

# הפעלת מסד הנתונים
pnpm db:push

# הפעלת השרת
pnpm dev
```

### סקריפטים זמינים
```bash
# פיתוח
pnpm dev          # הפעלת client ו-server במקביל
pnpm dev:client   # הפעלת client בלבד (פורט 3016)
pnpm dev:server   # הפעלת server בלבד (פורט 3001)

# בנייה
pnpm build        # בניית כל הפרויקט
pnpm start        # הפעלת production

# מסד נתונים
pnpm db:generate  # יצירת Prisma client
pnpm db:push      # עדכון schema
pnpm db:migrate   # הרצת migrations
pnpm db:studio    # פתיחת Prisma Studio

# בדיקות ואיכות
pnpm lint         # בדיקת קוד
pnpm type-check   # בדיקת TypeScript
pnpm test         # הרצת בדיקות
```

## 📁 מבנה הפרויקט

```
construction-excel-pro/
├── apps/
│   ├── client/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   │   ├── ai/        # AI Helper components
│   │   │   │   ├── 3d/        # 3D/BIM Viewer
│   │   │   │   ├── ar/        # AR components
│   │   │   │   ├── analytics/ # Predictive Analytics
│   │   │   │   ├── layout/    # Layout components
│   │   │   │   ├── sheets/    # Spreadsheet components
│   │   │   │   └── ui/        # UI components
│   │   │   ├── lib/           # Utilities
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── store/         # State management
│   │   │   └── types/         # TypeScript types
│   │   └── public/            # Static assets
│   └── server/                # Express backend
│       ├── src/
│       │   ├── routes/        # API routes
│       │   ├── middleware/    # Express middleware
│       │   ├── services/      # Business logic
│       │   ├── models/        # Database models
│       │   └── utils/         # Utilities
│       └── prisma/            # Database schema
├── packages/                  # Shared packages
├── docs/                     # Documentation
└── scripts/                  # Build scripts
```

## 🎨 עיצוב ו-UX

### עקרונות עיצוב
- **מראה טבלאי** דמוי Excel עם נוסחאות ותא-פורמולה
- **עריכה שורתית/תאית** + מצב מלא (spreadsheet)
- **שיתוף ושכפול גרסאות** עם control of edits + audit log
- **קישור תאים** לקובץ/שרטוט (PDF/DWG/IFC)
- **תצוגה מותאמת** למדדים ענפיים (BOQ, Cost, Schedule)

### מסכים מרכזיים
1. **Dashboard** – מצב כללי, מעקב עלויות, לוח זמנים
2. **Sheets Grid** – עריכה מלאה, formula bar, attachments
3. **BOQ View** – grouped by trade/material, subtotals
4. **Drawing Panel** – viewer לצד ה-grid, קישור לרכיבים
5. **Timeline/Gantt** – תצוגה מקושרת לשורות בטבלה
6. **Version History** – השוואת גרסאות, החזרת גרסה
7. **Mobile AR** – site diaries, daily reports, approvals

## 🔒 אבטחה

- **Authentication**: OAuth2 / OpenID Connect + SSO
- **Authorization**: RBAC per project and per sheet
- **Data encryption**: TLS in transit + SSE/KMS at rest
- **Audit logs**: Immutable append-only history
- **Backups**: Daily + point-in-time recovery
- **Compliance**: GDPR/ISO 27001

## 📊 API Documentation

### Endpoints עיקריים
```typescript
// Authentication
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

// Sheets
GET    /api/projects/:id/sheets
POST   /api/sheets
GET    /api/sheets/:id
PATCH  /api/sheets/:id/cells
POST   /api/sheets/:id/import
GET    /api/sheets/:id/export

// Files
POST   /api/projects/:id/files
GET    /api/projects/:id/files
DELETE /api/files/:id

// Realtime
Socket: join project, sheet
Events: cell:update, cell:lock, sheet:version
```

## 🧪 בדיקות

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Load testing
pnpm test:load

# Coverage
pnpm test:coverage
```

## 🚀 פריסה

### Production
```bash
# Build
pnpm build

# Deploy to Vercel (Frontend)
vercel --prod

# Deploy to AWS (Backend)
aws ecs update-service --service construction-api
```

### Docker
```bash
# Build images
docker-compose build

# Run locally
docker-compose up

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Roadmap

### MVP (שלב 1)
- [x] בסיס auth, projects, basic sheets
- [x] XLSX import/export, file upload
- [x] Realtime collaboration, versioning
- [x] BOQ calculations, templates, PDF export

### שלב 2
- [ ] Integrations BIM/IFC, AI helper
- [ ] Schedule sync, mobile app
- [ ] Advanced analytics, reporting

### שלב 3
- [ ] Enterprise features: SSO, advanced RBAC
- [ ] On-premise option, custom integrations
- [ ] Advanced AI features, automation

## 🤝 תרומה לפרויקט

1. Fork הפרויקט
2. צור feature branch (`git checkout -b feature/amazing-feature`)
3. Commit השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ [LICENSE](LICENSE) לפרטים.

## 📞 יצירת קשר

- **Email**: contact@probuilder.app
- **Website**: https://probuilder.app
- **Documentation**: https://docs.probuilder.app

---

**ProBuilder** - מערכת הבנייה החכמה של העתיד 🏗️✨
