# הוראות דיפלוי - ProBuilder

## Netlify

1. העלה את הפרויקט ל-GitHub
2. התחבר ל-Netlify
3. בחר "New site from Git"
4. בחר את ה-repository שלך
5. הגדרות:
   - Build command: `cd apps/client && pnpm build`
   - Publish directory: `apps/client/out`

## Vercel

1. התחבר ל-Vercel
2. בחר "Import Project"
3. בחר את ה-repository שלך
4. הגדרות:
   - Framework Preset: Next.js
   - Root Directory: `apps/client` (חשוב מאוד!)
   - Build Command: `pnpm --filter client build` (או פשוט `pnpm build` אם Root Directory מוגדר ל-apps/client)
   - Install Command: `pnpm install`

**הערה חשובה**: אם יש שגיאת 404, ודא ש-Root Directory מוגדר ל-`apps/client` ב-Vercel Dashboard בפרויקט שלך.

## קישורים

- **Netlify**: [netlify.com](https://netlify.com)
- **Vercel**: [vercel.com](https://vercel.com)

## הערות

- הפרויקט מוכן לדיפלוי
- כל הקבצים הנדרשים נוצרו
- הבנייה הושלמה בהצלחה
