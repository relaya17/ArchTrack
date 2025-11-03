'use client'

import React from 'react'
import { Shield, Eye, Lock, Database, UserCheck } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">מדיניות פרטיות</h1>
            <p className="text-gray-600">הגנה על הפרטיות שלך היא העדיפות הראשונה שלנו</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">איסוף מידע</h2>
            <p className="text-gray-700 mb-6">
              אנו אוספים מידע אישי רק כאשר הוא נחוץ לספק את השירותים שלנו. 
              המידע כולל שם, אימייל, פרטי חברה ומידע טכני הקשור לשימוש במערכת.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">שימוש במידע</h2>
            <p className="text-gray-700 mb-6">
              המידע שלך משמש לספק שירותים, לשפר את המערכת, לתקשר איתך 
              ולעמוד בדרישות משפטיות. לעולם לא נמכור את המידע שלך לצדדים שלישיים.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">אבטחת מידע</h2>
            <p className="text-gray-700 mb-6">
              אנו משתמשים בטכנולוגיות אבטחה מתקדמות כדי להגן על המידע שלך, 
              כולל הצפנה, גיבויים קבועים ומערכות ניטור מתקדמות.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">זכויותיך</h2>
            <p className="text-gray-700 mb-6">
              יש לך זכות לגשת למידע שלך, לעדכן אותו, למחוק אותו או להגביל את השימוש בו. 
              תוכל לפנות אלינו בכל עת בנוגע לפרטיותך.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">צור קשר</h3>
              <p className="text-blue-800">
                אם יש לך שאלות בנוגע למדיניות הפרטיות, אנא צור איתנו קשר בכתובת: 
                <a href="mailto:privacy@probuilder.co.il" className="font-semibold">privacy@probuilder.co.il</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
