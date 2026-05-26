import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTimeSeries, fetchCampaigns } from '@/lib/google-ads'
import { getPresetDateRanges, percentChange } from '@/lib/utils'
import type { DateRange, PeriodComparison } from '@/types'

export function useAnalytics(customerId: string | null) {
  const presets = getPresetDateRanges()
  const [dateRange, setDateRange] = useState<DateRange>(presets[2])

  const chartQuery = useQuery({
    queryKey: ['analytics', 'timeseries', customerId, dateRange.gaqlRange],
    queryFn: () => fetchTimeSeries(customerId!, dateRange.gaqlRange),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })

  const currentQuery = useQuery({
    queryKey: ['analytics', 'current', customerId, dateRange.gaqlRange],
    queryFn: () => fetchCampaigns(customerId!, dateRange.gaqlRange),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })

  const prevPreset = presets[presets.indexOf(dateRange) + 1] ?? presets[presets.length - 1]
  const prevQuery = useQuery({
    queryKey: ['analytics', 'previous', customerId, prevPreset.gaqlRange],
    queryFn: () => fetchCampaigns(customerId!, prevPreset.gaqlRange),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })

  const comparison: PeriodComparison | undefined = (() => {
    if (!currentQuery.data || !prevQuery.data) return undefined
    const agg = (campaigns: typeof currentQuery.data) => {
      return campaigns.reduce(
        (acc, c) => ({
          impressions: acc.impressions + c.metrics.impressions,
          clicks: acc.clicks + c.metrics.clicks,
          cost: acc.cost + c.metrics.cost,
          conversions: acc.conversions + c.metrics.conversions,
          ctr: 0,
          roas: 0,
          cpa: 0,
          cpc: 0,
        }),
        { impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0, roas: 0, cpa: 0, cpc: 0 }
      )
    }
    const cur = agg(currentQuery.data)
    const prev = agg(prevQuery.data)
    cur.ctr = cur.impressions > 0 ? cur.clicks / cur.impressions : 0
    cur.roas = cur.cost > 0 ? currentQuery.data.reduce((s, c) => s + c.metrics.conversionsValue, 0) / cur.cost : 0
    cur.cpa = cur.conversions > 0 ? cur.cost / cur.conversions : 0
    cur.cpc = cur.clicks > 0 ? cur.cost / cur.clicks : 0
    prev.ctr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0
    prev.roas = prev.cost > 0 ? prevQuery.data.reduce((s, c) => s + c.metrics.conversionsValue, 0) / prev.cost : 0
    prev.cpa = prev.conversions > 0 ? prev.cost / prev.conversions : 0
    prev.cpc = prev.clicks > 0 ? prev.cost / prev.clicks : 0
    return {
      current: { label: dateRange.label, ...cur },
      previous: { label: prevPreset.label, ...prev },
    }
  })()

  return {
    chartData: chartQuery.data ?? [],
    comparison,
    isLoading: chartQuery.isLoading || currentQuery.isLoading,
    dateRange,
    setDateRange,
    presets,
  }
}
