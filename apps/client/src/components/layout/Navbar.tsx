'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { 
  Sun, 
  Moon, 
  Globe, 
  LogIn,
  UserPlus,
  Menu,
  X
} from 'lucide-react'

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('he')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // כאן תוכל להוסיף לוגיקה לשינוי ערכת הנושא
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    // כאן תוכל להוסיף לוגיקה לשינוי שפה
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ProBuilder</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                title="בחר שפה"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>


            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-gray-500" />
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                title="החלף בין מצב יום ולילה"
                aria-label="החלף בין מצב יום ולילה"
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <Moon className="w-4 h-4 text-gray-500" />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/login'}
              >
                <LogIn className="w-4 h-4 mr-2" />
                התחברות
              </Button>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = '/register'}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                הרשמה
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                  title="בחר שפה"
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>


              {/* Theme Toggle */}
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-gray-500" />
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title="החלף בין מצב יום ולילה"
                  aria-label="החלף בין מצב יום ולילה"
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <Moon className="w-4 h-4 text-gray-500" />
              </div>

              {/* User Actions */}
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  התחברות
                </Button>
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  onClick={() => window.location.href = '/register'}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  הרשמה
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
