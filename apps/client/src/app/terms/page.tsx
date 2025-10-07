'use client'

import React from 'react'
import { Shield, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">תנאי שימוש</h1>
            <p className="text-gray-600">התנאים וההגבלות לשימוש במערכת ProBuilder</p>
            <p className="text-sm text-gray-500 mt-2">עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* הסכמה לשימוש */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                1. הסכמה לשימוש
              </h2>
              <p className="text-gray-700 mb-4">
                על ידי שימוש במערכת ProBuilder, אתה מסכים לתנאים המפורטים להלן. 
                אם אינך מסכים לתנאים אלה, אנא אל תשתמש במערכת.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>השימוש במערכת מותר למטרות מקצועיות בלבד</li>
                <li>אסור להשתמש במערכת למטרות בלתי חוקיות או מזיקות</li>
                <li>יש לשמור על סודיות המידע המקצועי</li>
                <li>אסור לשתף פרטי התחברות עם אחרים</li>
              </ul>
            </section>

            {/* רישיון שימוש */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="w-6 h-6 text-blue-600" />
                2. רישיון שימוש
              </h2>
              <p className="text-gray-700 mb-4">
                ProBuilder מעניק לך רישיון מוגבל, לא בלעדי ולא ניתן להעברה לשימוש במערכת.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">מה מותר:</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>שימוש במערכת למטרות מקצועיות</li>
                  <li>יצירה ועריכה של פרויקטים</li>
                  <li>שיתוף מידע עם צוות הפרויקט</li>
                  <li>יצירת גיבויים של הנתונים שלך</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-red-900 mb-2">מה אסור:</h3>
                <ul className="list-disc list-inside text-red-800 space-y-1">
                  <li>העתקה או הפצה של המערכת</li>
                  <li>ניסיון לפרוץ או לעקוף אבטחה</li>
                  <li>שימוש במערכת למטרות בלתי חוקיות</li>
                  <li>שיתוף פרטי התחברות</li>
                </ul>
              </div>
            </section>

            {/* הגבלות אחריות */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                3. הגבלות אחריות
              </h2>
              <p className="text-gray-700 mb-4">
                השימוש במערכת הוא על אחריותך הבלעדית. ProBuilder לא יהיה אחראי לנזקים שיכולים להיגרם כתוצאה מהשימוש במערכת.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">הגבלות אחריות:</h3>
                <ul className="list-disc list-inside text-yellow-800 space-y-1">
                  <li>ProBuilder לא אחראי לאובדן נתונים</li>
                  <li>ProBuilder לא אחראי לנזקים עקיפים</li>
                  <li>ProBuilder לא אחראי להפרעות בשירות</li>
                  <li>האחריות מוגבלת לסכום התשלום ששולם</li>
                </ul>
              </div>
            </section>

            {/* הגנת פרטיות */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                4. הגנת פרטיות
              </h2>
              <p className="text-gray-700 mb-4">
                אנו מחויבים להגן על הפרטיות שלך ועל המידע המקצועי שלך. 
                ראה את <a href="/privacy" className="text-blue-600 hover:underline">מדיניות הפרטיות</a> שלנו לפרטים נוספים.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">התחייבויותינו:</h3>
                <ul className="list-disc list-inside text-green-800 space-y-1">
                  <li>הצפנת מידע רגיש</li>
                  <li>גיבויים קבועים של הנתונים</li>
                  <li>הגבלת גישה למידע</li>
                  <li>שמירה על סודיות מקצועית</li>
                </ul>
              </div>
            </section>

            {/* שינויים בתנאים */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-600" />
                5. שינויים בתנאים
              </h2>
              <p className="text-gray-700 mb-4">
                אנו שומרים לעצמנו את הזכות לשנות את תנאי השימוש בכל עת. 
                שינויים משמעותיים יועברו אליך בדוא"ל או דרך המערכת.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">תהליך עדכון:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>הודעה מוקדמת של 30 יום לשינויים משמעותיים</li>
                  <li>עדכון אוטומטי של שינויים קלים</li>
                  <li>אפשרות לבטל את השירות אם אינך מסכים לשינויים</li>
                  <li>שמירה על גרסה קודמת של התנאים</li>
                </ul>
              </div>
            </section>

            {/* ביטול השירות */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                6. ביטול השירות
              </h2>
              <p className="text-gray-700 mb-4">
                אתה יכול לבטל את השירות בכל עת. אנו נשמור את הנתונים שלך למשך 30 יום לאחר הביטול.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">תהליך ביטול:</h3>
                <ul className="list-disc list-inside text-red-800 space-y-1">
                  <li>הודעה מוקדמת של 7 ימים לביטול</li>
                  <li>הורדת הנתונים שלך לפני הביטול</li>
                  <li>החזר כספי לפי מדיניות ההחזרים</li>
                  <li>מחיקת הנתונים לאחר 30 יום</li>
                </ul>
              </div>
            </section>

            {/* יצירת קשר */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. יצירת קשר</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">שאלות או בעיות?</h3>
                <p className="text-blue-800 mb-4">
                  אם יש לך שאלות בנוגע לתנאי השימוש, אנא צור איתנו קשר:
                </p>
                <div className="space-y-2 text-blue-800">
                  <p><strong>אימייל:</strong> <a href="mailto:legal@probuilder.co.il" className="font-semibold">legal@probuilder.co.il</a></p>
                  <p><strong>טלפון:</strong> <a href="tel:+972-3-123-4567" className="font-semibold">03-123-4567</a></p>
                  <p><strong>כתובת:</strong> רחוב הטכנולוגיה 123, תל אביב, ישראל</p>
                </div>
              </div>
            </section>

            {/* הסכמה */}
            <section className="mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">הסכמה לתנאים</h3>
                <p className="text-green-800 mb-4">
                  על ידי המשך השימוש במערכת, אתה מאשר שקראת והבנת את תנאי השימוש ואתה מסכים להם.
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    אני מסכים לתנאי השימוש ומדיניות הפרטיות
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
