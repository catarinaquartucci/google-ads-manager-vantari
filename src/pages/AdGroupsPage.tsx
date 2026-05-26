import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdGroupForm, type AdGroupFormData } from '@/components/campaigns/AdGroupForm'
import { useAdGroups, useCreateAdGroup } from '@/hooks/useAdGroups'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatNumber, formatPercentage, statusLabel } from '@/lib/utils'
import type { DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

export function AdGroupsPage() {
  const { dateRange, customerId } = useOutletContext<OutletCtx>()
  const { data: adGroups = [], isLoading } = useAdGroups(customerId, dateRange.gaqlRange)
  const { data: campaigns = [] } = useCampaigns(customerId, dateRange.gaqlRange)
  const { mutateAsync: create, isPending } = useCreateAdGroup(customerId)
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)

  const handleSubmit = async (data: AdGroupFormData) => {
    try {
      await create(data)
      toast({ title: 'Grupo criado' })
      setFormOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: String(err), variant: 'destructive' })
    }
  }

  const statusBadge = (s: string) => s === 'ENABLED' ? 'success' : s === 'PAUSED' ? 'warning' : 'destructive'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Grupos de Anuncios ({adGroups.length})</h2>
        <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Grupo</Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Impressoes</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adGroups.map(ag => (
                <TableRow key={ag.id}>
                  <TableCell className="font-medium">{ag.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{ag.campaignName}</TableCell>
                  <TableCell><Badge variant={statusBadge(ag.status) as 'success' | 'warning' | 'destructive'}>{statusLabel(ag.status)}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(ag.cpcBid)}</TableCell>
                  <TableCell className="text-right">{formatNumber(ag.metrics.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(ag.metrics.clicks)}</TableCell>
                  <TableCell className="text-right">{formatPercentage(ag.metrics.ctr)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ag.metrics.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <AdGroupForm open={formOpen} onOpenChange={setFormOpen} campaigns={campaigns} onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  )
}
