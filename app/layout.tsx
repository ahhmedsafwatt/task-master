import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { geistmono, inter, cabinet } from '@/lib/fonts'
import Provider from '@/lib/providers/provider'
import { PerformanceMonitor } from '@/components/performance-monitor'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://task-master-drab-delta.vercel.app'),
  title: {
    default: 'Task Master',
    template: 'Task Master | %s',
  },
  description:
    'Streamline your workflow with Task Master - the intuitive task management application that helps you organize, prioritize, and track your projects efficiently.',
  keywords: ['task management', 'productivity', 'project tracking', 'todo app'],
  authors: [{ name: 'Ahmed Safwat' }],
  creator: 'Task Master',
  publisher: 'Task Master',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Task Master - Efficient Task Management',
    description:
      'Streamline your workflow with Task Master - the intuitive task management application that helps you organize, prioritize, and track your projects efficiently.',
    siteName: 'Task Master',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Task Master - Efficient Task Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Task Master - Efficient Task Management',
    description:
      'Streamline your workflow with Task Master - the intuitive task management application.',
    images: ['/images/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-token', // Add your verification token
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistmono.variable} ${cabinet.variable} antialiased`}
        suppressHydrationWarning
      >
        <Provider>
          {children}
          <SpeedInsights />
          <Analytics />
          <PerformanceMonitor />
        </Provider>
      </body>
    </html>
  )
}
