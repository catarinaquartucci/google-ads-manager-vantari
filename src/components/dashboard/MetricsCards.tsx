import { TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage, percentChange } from '@/lib/utils'
import type { Campaign } from '@/types'

interface MetricsCardsProps {
  campaigns: Campaign[]
  prevCampaigns?: Campaign[]
}

function agg(campaigns: Campaign[]) {
  return campaigns.reduce(
    (acc, c) => ({
      cost: acc.cost + c.metrics.cost,
      impressions: acc.impressions + c.metrics.impressions,
      clicks: acc.clicks + c.metrics.clicks,
      conversions: acc.conversions + c.metrics.conversions,
      conversionsValue: acc.conversionsValue + c.metrics.conversionsValue,
    }),
    { cost: 0, impressions: 0, clicks: 0, conversions: 0, conversionsValue: 0 }
  )
}

export function MetricsCards({ campaigns, prevCampaigns }: MetricsCardsProps) {
  const cur = agg(campaigns)
  const prev = prevCampaigns ? agg(prevCampaigns) : null
  const roas = cur.cost > 0 ? cur.conversionsValue / cur.cost : 0

  const cards = [
    {
      title: 'Investimento',
      value: formatCurrency(cur.cost),
      icon: DollarSign,
      change: prev ? percentChange(cur.cost, prev.cost) : null,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Impressões',
      value: formatNumber(cur.impressions),
      icon: Eye,
      change: prev ? percentChange(cur.impressions, prev.impressions) : null,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Cliques',
      value: formatNumber(cur.clicks),
      icon: MousePointer,
      change: prev ? percentChange(cur.clicks, prev.clicks) : null,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'ROAS',
      value: roas.toFixed(2) + 'x',
      icon: Target,
      change: prev && prev.cost > 0 ? percentChange(roas, prev.conversionsValue / prev.cost) : null,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = (card.change ?? 0) >= 0
        const TrendIcon = isPositive ? TrendingUp : TrendingDown
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change !== null && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(card.change).toFixed(1)}% vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
