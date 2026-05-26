import { useState } from 'react'
import { AlertTriangle, RefreshCw, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { invokeEdgeFunction } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'
import { formatPercentage } from '@/lib/utils'
import type { Campaign, CreativeFatigueReport } from '@/types'

interface CreativeFatigueProps {
  campaigns: Campaign[]
}

export function CreativeFatigue({ campaigns }: CreativeFatigueProps) {
  const [report, setReport] = useState<CreativeFatigueReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const analyze = async () => {
    setIsLoading(true)
    try {
      const resp = await invokeEdgeFunction<{ reports: CreativeFatigueReport[] }>('claude-ai', {
        mode: 'fatigue',
        userId: getCurrentUserId(),
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          ctr: c.metrics.ctr,
          status: c.status,
          impressions: c.metrics.impressions,
        })),
      })
      setReport(resp.reports ?? [])
      setAnalyzed(true)
    } catch {
      alert('Erro ao analisar fadiga criativa.')
    } finally {
      setIsLoading(false)
    }
  }

  const severityVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
    low: 'success', medium: 'warning', high: 'destructive',
  }
  const severityLabel: Record<string, string> = { low: 'Baixa', medium: 'Media', high: 'Alta' }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            Diagnostico de Fadiga Criativa
          </CardTitle>
          <p className="text-sm text-gray-500">Detecta queda de CTR e sugere rotacao de criativos</p>
        </CardHeader>
        <CardContent>
          <Button onClick={analyze} disabled={isLoading || !campaigns.length} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analisando...' : 'Analisar Campanhas'}
          </Button>
        </CardContent>
      </Card>

      {analyzed && report.length === 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-green-600">
            <span className="text-2xl">OK</span>
            <div>
              <p className="font-medium">Nenhuma fadiga criativa detectada</p>
              <p className="text-sm text-gray-500">Seus criativos estao performando bem.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {report.length} campanha(s) com fadiga detectada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">CTR atual</TableHead>
                  <TableHead className="text-right">Variacao</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Recomendacao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((r) => (
                  <TableRow key={r.campaignId}>
                    <TableCell className="font-medium">{r.campaignName}</TableCell>
                    <TableCell className="text-right">{formatPercentage(r.ctrWeek4)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-red-600">{r.change.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[r.severity]}>{severityLabel[r.severity]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs">{r.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
