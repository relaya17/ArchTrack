'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { 
  Sun, 
  Moon, 
  Globe, 
  Shield, 
  Eye, 
  Smartphone,
  User,
  LogIn,
  UserPlus
} from 'lucide-react'

export default function Footer() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('he')

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // כאן תוכל להוסיף לוגיקה לשינוי ערכת הנושא
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    // כאן תוכל להוסיף לוגיקה לשינוי שפה
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-4">ProBuilder</h3>
            <p className="text-gray-400 mb-4">
              מערכת גיליונות חכמה מקצועית לענף הבנייה והאדריכלות
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">ניהול פרויקטים</a></li>
              <li><a href="/sheets" className="text-gray-400 hover:text-white transition-colors">גיליונות</a></li>
              <li><a href="/boq" className="text-gray-400 hover:text-white transition-colors">BOQ</a></li>
              <li><a href="/drawings" className="text-gray-400 hover:text-white transition-colors">תכניות</a></li>
              <li><a href="/chat" className="text-gray-400 hover:text-white transition-colors">צ'אט</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">תמיכה</h4>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-400 hover:text-white transition-colors">עזרה</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">צור קשר</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-white transition-colors">שאלות נפוצות</a></li>
              <li><a href="/tutorials" className="text-gray-400 hover:text-white transition-colors">מדריכים</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">מידע משפטי</h4>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">מדיניות פרטיות</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">תנאי שימוש</a></li>
              <li><a href="/accessibility" className="text-gray-400 hover:text-white transition-colors">נגישות</a></li>
              <li><a href="/cookies" className="text-gray-400 hover:text-white transition-colors">מדיניות עוגיות</a></li>
            </ul>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex justify-center">
            <div className="text-gray-400 text-sm">
              © 2024 ProBuilder. כל הזכויות שמורות.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
