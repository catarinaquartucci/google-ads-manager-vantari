import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage, percentChange } from '@/lib/utils'
import type { PeriodComparison as PeriodComparisonType } from '@/types'

interface PeriodComparisonProps {
  comparison?: PeriodComparisonType
}

const metrics = [
  { key: 'impressions', label: 'Impressões', format: (v: number) => formatNumber(v), positiveIsGood: true },
  { key: 'clicks', label: 'Cliques', format: (v: number) => formatNumber(v), positiveIsGood: true },
  { key: 'cost', label: 'Investimento', format: (v: number) => formatCurrency(v), positiveIsGood: false },
  { key: 'conversions', label: 'Conversões', format: (v: number) => formatNumber(v, 1), positiveIsGood: true },
  { key: 'ctr', label: 'CTR', format: (v: number) => formatPercentage(v), positiveIsGood: true },
  { key: 'roas', label: 'ROAS', format: (v: number) => v.toFixed(2) + 'x', positiveIsGood: true },
  { key: 'cpa', label: 'CPA', format: (v: number) => formatCurrency(v), positiveIsGood: false },
  { key: 'cpc', label: 'CPC médio', format: (v: number) => formatCurrency(v), positiveIsGood: false },
]

export function PeriodComparison({ comparison }: PeriodComparisonProps) {
  if (!comparison) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Aguardando dados...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparação de Períodos</CardTitle>
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="font-medium text-blue-600">● {comparison.current.label}</span>
          <span>vs {comparison.previous.label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ key, label, format, positiveIsGood }) => {
            const cur = comparison.current[key as keyof typeof comparison.current] as number
            const prev = comparison.previous[key as keyof typeof comparison.previous] as number
            const change = percentChange(cur, prev)
            const isPositive = change >= 0
            const isGood = positiveIsGood ? isPositive : !isPositive
            const Icon = Math.abs(change) < 0.1 ? Minus : isPositive ? TrendingUp : TrendingDown

            return (
              <div key={key} className="p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-bold">{format(cur)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(prev)}</p>
                <div className={`flex items-center gap-1 text-xs mt-1 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                  <Icon className="h-3 w-3" />
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
