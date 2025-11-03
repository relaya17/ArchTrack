# 🚀 הוראות דיפלוי ל-Render - ArchTrack

מדריך מפורט לדיפלוי פרויקט ArchTrack (ProBuilder) לפלטפורמת Render.

## 📋 דרישות מקדימות

1. **חשבון Render** - הירשם ב-[render.com](https://render.com)
2. **GitHub Repository** - הפרויקט חייב להיות ב-GitHub
3. **GitHub Access** - הרשאות לכתוב ל-repository

## 🔧 הגדרת הפרויקט

### שלב 1: הכנת הפרויקט

1. **ודא שהפרויקט מוכן לדיפלוי:**
   ```bash
   # בדיקת build מקומי
   pnpm build
   
   # בדיקת הפעלה
   pnpm start
   ```

2. **עדכן את הקבצים הבאים:**
   - `render.yaml` - קובץ הגדרות Render
   - `Dockerfile.render` - קובץ Docker לדיפלוי
   - `env.render` - משתני סביבה לדיפלוי

### שלב 2: יצירת שירותים ב-Render

#### Frontend (Next.js Client)

1. **לך ל-Render Dashboard**
2. **לחץ על "New +" → "Web Service"**
3. **הגדרות בסיסיות:**
   - **Name**: `archtrack-frontend`
   - **Environment**: `Node`
   - **Build Command**: `cd apps/client && pnpm install && pnpm build`
   - **Start Command**: `cd apps/client && pnpm start`
   - **Plan**: `Starter` (חינם)

4. **משתני סביבה:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-service.onrender.com
   ```

#### Backend (Express Server)

1. **לחץ על "New +" → "Web Service"**
2. **הגדרות בסיסיות:**
   - **Name**: `archtrack-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd apps/server && pnpm install && pnpm build`
   - **Start Command**: `cd apps/server && pnpm start`
   - **Plan**: `Starter` (חינם)

3. **משתני סביבה:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://archtrack-frontend.onrender.com
   ```

#### Mobile App (React Native Web)

1. **לחץ על "New +" → "Web Service"**
2. **הגדרות בסיסיות:**
   - **Name**: `archtrack-mobile`
   - **Environment**: `Node`
   - **Build Command**: `cd apps/mobile && pnpm install && pnpm build`
   - **Start Command**: `cd apps/mobile && pnpm start`
   - **Plan**: `Starter` (חינם)

### שלב 3: יצירת מסדי נתונים

#### MongoDB Database

1. **לחץ על "New +" → "MongoDB"**
2. **הגדרות:**
   - **Name**: `archtrack-mongodb`
   - **Plan**: `Starter` (חינם)

## 🔗 חיבור השירותים

### עדכון משתני סביבה

1. **Backend Service:**
   ```
   MONGODB_URI=<MongoDB connection string>
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://archtrack-frontend.onrender.com
   ```

2. **Frontend Service:**
   ```
   NEXT_PUBLIC_API_URL=https://archtrack-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://archtrack-backend.onrender.com
   ```

3. **Mobile Service:**
   ```
   REACT_APP_API_URL=https://archtrack-backend.onrender.com
   ```

## 🚀 דיפלוי אוטומטי

### שימוש ב-render.yaml

1. **העלה את `render.yaml` ל-root של הפרויקט**
2. **ב-Render Dashboard:**
   - לך ל-"Blueprints"
   - לחץ על "New Blueprint"
   - בחר את ה-repository שלך
   - Render ייצור את כל השירותים אוטומטית

### דיפלוי ידני

1. **חבר את GitHub repository לכל שירות**
2. **הגדר Auto-Deploy:**
   - Branch: `main`
   - Auto-Deploy: `Yes`

## 🔧 הגדרות מתקדמות

### Health Checks

```yaml
# ב-render.yaml
healthCheckPath: /api/health
```

### Custom Domains

1. **ב-Render Dashboard:**
   - לך לשירות
   - Settings → Custom Domains
   - הוסף domain מותאם אישית

### SSL Certificates

- Render מספק SSL אוטומטי
- אין צורך בהגדרה נוספת

## 📊 מעקב ובקרה

### Logs

1. **ב-Render Dashboard:**
   - לך לשירות
   - לחץ על "Logs"
   - צפה ב-logs בזמן אמת

### Metrics

1. **ב-Render Dashboard:**
   - לך לשירות
   - לחץ על "Metrics"
   - צפה בביצועים

### Alerts

1. **הגדר התראות:**
   - Settings → Alerts
   - הוסף email notifications

## 🛠 פתרון בעיות

### בעיות נפוצות

1. **Build Fails:**
   ```bash
   # בדוק logs ב-Render
   # ודא שכל ה-dependencies מותקנים
   ```

2. **Database Connection:**
   ```bash
   # ודא שה-DATABASE_URL נכון
   # בדוק שה-PostgreSQL service פעיל
   ```

3. **Environment Variables:**
   ```bash
   # ודא שכל המשתנים מוגדרים
   # בדוק את ה-format של המשתנים
   ```

### Debug Commands

```bash
# בדיקת build מקומי
pnpm render:build

# בדיקת health
pnpm render:health

# דיפלוי ידני
pnpm render:deploy
```

## 💰 עלויות

### Starter Plan (חינם)
- **Web Services**: 750 שעות/חודש
- **PostgreSQL**: 1GB storage
- **Redis**: 25MB storage
- **Bandwidth**: 100GB/חודש

### Upgrade Options
- **Starter**: $7/חודש לשירות
- **Standard**: $25/חודש לשירות
- **Pro**: $85/חודש לשירות

## 🔒 אבטחה

### Environment Variables
- **אל תעלה secrets ל-Git**
- **השתמש ב-Render Environment Variables**
- **השתמש ב-JWT secrets חזקים**

### Database Security
- **השתמש ב-SSL connections**
- **הגדר firewall rules**
- **עשה backup קבוע**

## 📞 תמיכה

### Render Support
- **Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

### ArchTrack Support
- **GitHub Issues**: פתח issue ב-repository
- **Email**: contact@archtrack.app

## 🎯 צעדים הבאים

1. **הגדר monitoring מתקדם**
2. **הוסף CI/CD pipeline**
3. **הגדר backup אוטומטי**
4. **הוסף performance monitoring**
5. **הגדר error tracking (Sentry)**

---

**ArchTrack על Render** - מערכת הבנייה החכמה בענן ☁️🏗️
