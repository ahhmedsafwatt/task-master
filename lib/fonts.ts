import { Inter, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin'],
  variable: '--inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const geistmono = Geist_Mono({
  subsets: ['latin'],
  variable: '--geist-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: false, // Only preload essential fonts
  fallback: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
})

// Only load the most essential Cabinet Grotesk weights
const cabinet = localFont({
  src: [
    {
      path: '../public/fonts/cabinetgroteskregular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/cabinetgroteskbold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--cabinet',
  display: 'swap',
  preload: true, // Preload only critical weights
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})

export { inter, geistmono, cabinet }
