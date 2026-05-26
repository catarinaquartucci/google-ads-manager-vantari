import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdForm, type AdFormData } from '@/components/campaigns/AdForm'
import { useAds, useCreateAd } from '@/hooks/useAds'
import { useAdGroups } from '@/hooks/useAdGroups'
import { useToast } from '@/components/ui/use-toast'
import { formatNumber, formatPercentage, formatCurrency, statusLabel } from '@/lib/utils'
import type { DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '...' : s }

export function AdsPage() {
  const { dateRange, customerId } = useOutletContext<OutletCtx>()
  const { data: ads = [], isLoading } = useAds(customerId, dateRange.gaqlRange)
  const { data: adGroups = [] } = useAdGroups(customerId, dateRange.gaqlRange)
  const { mutateAsync: create, isPending } = useCreateAd(customerId)
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)

  const handleSubmit = async (data: AdFormData) => {
    try {
      await create(data)
      toast({ title: 'Anuncio criado' })
      setFormOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: String(err), variant: 'destructive' })
    }
  }

  const statusBadge = (s: string) => s === 'ENABLED' ? 'success' : s === 'PAUSED' ? 'warning' : 'destructive'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Anuncios ({ads.length})</h2>
        <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Anuncio</Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulos</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impressoes</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map(ad => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      {ad.headlines.slice(0, 3).map((h, i) => (
                        <p key={i} className="text-sm font-medium text-blue-700">{truncate(h.text, 30)}</p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{ad.campaignName} / {ad.adGroupName}</TableCell>
                  <TableCell><Badge variant={statusBadge(ad.status) as 'success' | 'warning' | 'destructive'}>{statusLabel(ad.status)}</Badge></TableCell>
                  <TableCell className="text-right">{formatNumber(ad.metrics.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(ad.metrics.clicks)}</TableCell>
                  <TableCell className="text-right">{formatPercentage(ad.metrics.ctr)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ad.metrics.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <AdForm open={formOpen} onOpenChange={setFormOpen} adGroups={adGroups} onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  )
}
