import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { AdGroupsPage } from '@/pages/AdGroupsPage'
import { AdsPage } from '@/pages/AdsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AIPage } from '@/pages/AIPage'
import { RulesPage } from '@/pages/RulesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/ad-groups" element={<AdGroupsPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
