'use client'

import React, { useState, useEffect } from 'react'
import useErrorAlerts from '../hooks/useErrorAlerts'
import { Button } from '../components/ui/button'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { 
  Building2, 
  Calculator, 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)

  // מאזין לשגיאות קריטיות דרך ה-errorBus ומציג באנר עמודי מינימלי
  useErrorAlerts({ notify: (e) => setLastError(e.message) })
  
  const constructionImages = [
    {
      url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "בנייה מודרנית",
      description: "פרויקטי בנייה מתקדמים עם טכנולוגיה חדישה"
    },
    {
      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "אמבטיות יוקרה",
      description: "אמבטיות חלומיות עם עיצוב מקצועי וחומרים איכותיים"
    },
    {
      url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "הפרדת חדרים",
      description: "תכנון פנים מתקדם עם הפרדות אלגנטיות"
    },
    {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "בנייה קלה",
      description: "בנייה מקירות גבס ועץ - פתרונות מהירים וחסכוניים"
    },
    {
      url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "מגדלי יוקרה",
      description: "פרויקטי נדל\"ן מתקדמים ומרשימים"
    },
    {
      url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "עיצוב פנים",
      description: "בניית חדרים מגבס עם טכנולוגיית לייזר מתקדמת"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === constructionImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // החלפה כל 5 שניות

    return () => clearInterval(interval)
  }, [constructionImages.length])

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === constructionImages.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? constructionImages.length - 1 : prevIndex - 1
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <Navbar />
      {lastError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-600/90 text-white rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{lastError}</span>
            <button
              type="button"
              className="text-white/80 hover:text-white text-sm"
              aria-label="סגור הודעת שגיאה"
              onClick={() => setLastError(null)}
            >
              סגור
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium mb-8 shadow-sm">
              <Award className="w-4 h-4 mr-2" />
              מערכת הבנייה המובילה בישראל
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="text-white">
                ProBuilder
              </span>
              <br />
              <span className="text-3xl md:text-5xl text-gray-300">
                מערכת גיליונות חכמה מקצועית
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              כלי העבודה המתקדם ביותר לאדריכלים, מהנדסים וקבלנים. 
              ניהול פרויקטים, BOQ, תקציבים וניתוח נתונים במקום אחד.
            </p>
            
          </div>
        </div>
      </div>

      {/* Construction Gallery Carousel */}
      <div className="relative py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              {/* Main Image */}
              <img
                src={constructionImages[currentImageIndex].url}
                alt={constructionImages[currentImageIndex].title}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {constructionImages[currentImageIndex].title}
                </h3>
                <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl">
                  {constructionImages[currentImageIndex].description}
                </p>
              </div>
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                title="תמונה קודמת"
                aria-label="תמונה קודמת"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextImage}
                title="תמונה הבאה"
                aria-label="תמונה הבאה"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {/* Thumbnail Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              {constructionImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  title={`עבור לתמונה ${index + 1}: ${image.title}`}
                  aria-label={`עבור לתמונה ${index + 1}: ${image.title}`}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Image Counter */}
            <div className="text-center mt-4">
              <span className="text-gray-500 text-sm">
                {currentImageIndex + 1} / {constructionImages.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">500+</div>
            <div className="text-gray-300">פרויקטים פעילים</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">₪2.5B</div>
            <div className="text-gray-300">ערך פרויקטים</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">98%</div>
            <div className="text-gray-300">שביעות רצון</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              הכלים המקצועיים שאתה צריך
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              מערכת מתקדמת המביאה את הטכנולוגיה החדישה ביותר לענף הבנייה
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project Management */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/dashboard'}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">ניהול פרויקטים</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  ניהול מתקדם של פרויקטי בנייה, מעקב תקציבים, לוחות זמנים ומשאבים
                </p>
                <div className="flex items-center text-blue-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  כלי ניהול מתקדמים
                </div>
              </div>
            </div>
            
            {/* BOQ Sheets */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/boq'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">גיליונות BOQ</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  יצירה ועריכה של גיליונות כמויות מפורטים עם נוסחאות מתקדמות
                </p>
                <div className="flex items-center text-green-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  נוסחאות חכמות
                </div>
              </div>
            </div>
            
            {/* Analytics */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/dashboard'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">ניתוח נתונים</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  ניתוח חיזוי עלויות, זיהוי סיכונים ותובנות עסקיות מתקדמות
                </p>
                <div className="flex items-center text-purple-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  AI מתקדם
                </div>
              </div>
            </div>
            
            {/* Team Collaboration */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/chat'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">שיתוף פעולה</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  עבודה משותפת עם הצוות, הערות, הערות וסנכרון בזמן אמת
                </p>
                <div className="flex items-center text-orange-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  זמן אמת
                </div>
              </div>
            </div>
            
            {/* Cost Calculator */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/boq'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">מחשבון עלויות</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  חישוב מדויק של עלויות, תמחור אוטומטי ועדכון מחירים
                </p>
                <div className="flex items-center text-yellow-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  דיוק מקסימלי
                </div>
              </div>
            </div>
            
            {/* Drawings & Plans */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/drawings'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">תכניות ושרטוטים</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  ניהול תכניות ארכיטקטורה, מבנה וטכניות עם כלי עריכה מתקדמים
                </p>
                <div className="flex items-center text-indigo-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  כלי עריכה מתקדמים
                </div>
              </div>
            </div>

            {/* Drawing Tool */}
            <div 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => window.location.href = '/drawing'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">כלי ציור מתקדם</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  כלי ציור מקצועי להדמיה של חדרים, תכנון אדריכלי וציור טכני
                </p>
                <div className="flex items-center text-pink-400 font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  סרגל, עיגול, צורות
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}