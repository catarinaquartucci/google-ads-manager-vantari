import { useOutletContext } from 'react-router-dom'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { CampaignTable } from '@/components/dashboard/CampaignTable'
import { Card } from '@/components/ui/card'
import { useCampaigns, usePauseCampaign, useEnableCampaign } from '@/hooks/useCampaigns'
import { useToast } from '@/components/ui/use-toast'
import type { DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

export function DashboardPage() {
  const { dateRange, customerId } = useOutletContext<OutletCtx>()
  const { data: campaigns = [], isLoading } = useCampaigns(customerId, dateRange.gaqlRange)
  const { mutate: pause } = usePauseCampaign(customerId)
  const { mutate: enable } = useEnableCampaign(customerId)
  const { toast } = useToast()

  const handlePause = (id: string) => {
    pause(id, { onSuccess: () => toast({ title: 'Campanha pausada' }) })
  }
  const handleEnable = (id: string) => {
    enable(id, { onSuccess: () => toast({ title: 'Campanha ativada' }) })
  }

  return (
    <div className="space-y-6">
      <MetricsCards campaigns={campaigns} />
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Campanhas ({campaigns.length})</h2>
        </div>
        <CampaignTable campaigns={campaigns} onPause={handlePause} onEnable={handleEnable} onEdit={() => {}} isLoading={isLoading} />
      </Card>
    </div>
  )
}
