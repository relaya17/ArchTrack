import React from 'react'
import dynamic from 'next/dynamic'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import { ToastProvider } from '../components/ui/Toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: 'ProBuilder - מערכת גיליונות חכמה לבנייה',
  description: 'מערכת מקצועית לניהול פרויקטי בנייה, BOQ, תקציבים ולוחות זמנים',
  keywords: ['בנייה', 'פרויקטים', 'ניהול', 'אדריכלות', 'הנדסה'],
  authors: [{ name: 'ProBuilder Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'ProBuilder - מערכת גיליונות חכמה לבנייה',
    description: 'מערכת מקצועית לניהול פרויקטי בנייה, BOQ, תקציבים ולוחות זמנים',
    type: 'website',
    locale: 'he_IL',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ErrorToaster = dynamic(() => import('../components/ErrorToaster'), { ssr: false })
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="probuilder-theme">
          <ToastProvider>
            <ErrorBoundary>
              {children}
              <ErrorToaster />
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
