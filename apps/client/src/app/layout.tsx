import React from 'react'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
        {children}
        <ErrorToaster />
      </body>
    </html>
  )
}
