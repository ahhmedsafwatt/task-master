import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export const LandingDarkWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const pathname = usePathname()

  useEffect(() => {
    const isLandingPage =
      pathname === '/' ||
      (!pathname.startsWith('/dashboard') && !pathname.startsWith('/auth'))

    if (isLandingPage) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [pathname])

  return <>{children}</>
}
