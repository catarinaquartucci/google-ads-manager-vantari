import { useOutletContext } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PerformanceChart } from '@/components/analytics/PerformanceChart'
import { PeriodComparison } from '@/components/analytics/PeriodComparison'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

export function AnalyticsPage() {
  const { customerId } = useOutletContext<OutletCtx>()
  const { chartData, comparison, isLoading } = useAnalytics(customerId)
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="comparison">Comparacao de Periodos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <PerformanceChart data={chartData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="comparison" className="mt-4">
          <PeriodComparison comparison={comparison} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
