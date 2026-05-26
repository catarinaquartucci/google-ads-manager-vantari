import { Pause, Play, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency, formatNumber, formatPercentage, statusLabel } from '@/lib/utils'
import type { Campaign } from '@/types'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  ENABLED: 'success',
  PAUSED: 'warning',
  REMOVED: 'destructive',
}

interface CampaignTableProps {
  campaigns: Campaign[]
  onPause: (id: string) => void
  onEnable: (id: string) => void
  onEdit: (campaign: Campaign) => void
  isLoading?: boolean
}

export function CampaignTable({ campaigns, onPause, onEnable, onEdit, isLoading }: CampaignTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
        <p>Nenhuma campanha encontrada</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campanha</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Orçamento/dia</TableHead>
          <TableHead className="text-right">Impressões</TableHead>
          <TableHead className="text-right">Cliques</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">CPC</TableHead>
          <TableHead className="text-right">Custo</TableHead>
          <TableHead className="text-right">Conv.</TableHead>
          <TableHead className="text-right">ROAS</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[c.status] ?? 'outline'}>{statusLabel(c.status)}</Badge>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(c.budget)}</TableCell>
            <TableCell className="text-right">{formatNumber(c.metrics.impressions)}</TableCell>
            <TableCell className="text-right">{formatNumber(c.metrics.clicks)}</TableCell>
            <TableCell className="text-right">{formatPercentage(c.metrics.ctr)}</TableCell>
            <TableCell className="text-right">{formatCurrency(c.metrics.averageCpc)}</TableCell>
            <TableCell className="text-right">{formatCurrency(c.metrics.cost)}</TableCell>
            <TableCell className="text-right">{formatNumber(c.metrics.conversions, 1)}</TableCell>
            <TableCell className="text-right">
              <span className={c.metrics.roas >= 2 ? 'text-green-600 font-medium' : c.metrics.roas >= 1 ? 'text-yellow-600' : 'text-red-600'}>
                {c.metrics.roas.toFixed(2)}x
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(c)}>
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  {c.status === 'ENABLED' ? (
                    <DropdownMenuItem onClick={() => onPause(c.id)}>
                      <Pause className="h-4 w-4 mr-2" /> Pausar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onEnable(c.id)}>
                      <Play className="h-4 w-4 mr-2" /> Ativar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
