import { useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import { getPresetDateRanges } from '@/lib/utils'
import type { DateRange } from '@/types'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/campaigns': 'Campanhas',
  '/ad-groups': 'Grupos de Anúncios',
  '/ads': 'Anúncios',
  '/analytics': 'Analytics',
  '/ai': 'IA Assistant',
  '/rules': 'Regras Automáticas',
}

export function Layout() {
  const { isAuthenticated, isLoading, customerId, signOut } = useAuth()
  const location = useLocation()
  const presets = getPresetDateRanges()
  const [dateRange, setDateRange] = useState<DateRange>(presets[2])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const title = pageTitles[location.pathname] ?? 'Google Ads Manager'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          customerId={customerId}
          onSignOut={signOut}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet context={{ dateRange, customerId }} />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
