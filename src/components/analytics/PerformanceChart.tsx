import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import type { ChartDataPoint } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type MetricKey = 'impressions' | 'clicks' | 'cost' | 'conversions' | 'ctr' | 'roas'

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: 'impressions', label: 'Impressões', color: '#6366f1' },
  { key: 'clicks', label: 'Cliques', color: '#22c55e' },
  { key: 'cost', label: 'Custo', color: '#f59e0b' },
  { key: 'conversions', label: 'Conversões', color: '#3b82f6' },
  { key: 'ctr', label: 'CTR', color: '#ec4899' },
  { key: 'roas', label: 'ROAS', color: '#14b8a6' },
]

function formatValue(key: MetricKey, value: number): string {
  if (key === 'cost') return formatCurrency(value)
  if (key === 'ctr') return formatPercentage(value)
  if (key === 'roas') return value.toFixed(2) + 'x'
  return formatNumber(value, 1)
}

interface PerformanceChartProps {
  data: ChartDataPoint[]
  isLoading?: boolean
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  const [selected, setSelected] = useState<MetricKey[]>(['clicks', 'conversions'])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const activeMetrics = metrics.filter((m) => selected.includes(m.key))

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance ao Longo do Tempo</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {metrics.map((m) => (
            <Button
              key={m.key}
              variant={selected.includes(m.key) ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleMetric(m.key)}
              style={selected.includes(m.key) ? { backgroundColor: m.color, borderColor: m.color } : {}}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
            Sem dados para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const m = metrics.find((m) => m.label === name)
                  return [m ? formatValue(m.key, value) : value, name]
                }}
              />
              <Legend />
              {activeMetrics.map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
