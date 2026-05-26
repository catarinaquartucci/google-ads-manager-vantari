import { invokeEdgeFunction } from './supabase'
import { getCurrentUserId } from './auth'
import { microsToCurrency, calculateCTR, calculateROAS, calculateCPA } from './utils'
import type { Campaign, AdGroup, Ad, ChartDataPoint, Metrics } from '@/types'

function getUserId() {
  const id = getCurrentUserId()
  if (!id) throw new Error('Not authenticated')
  return id
}

function parseMetrics(row: Record<string, Record<string, string>>): Metrics {
  const m = row.metrics ?? {}
  const impressions = Number(m.impressions ?? 0)
  const clicks = Number(m.clicks ?? 0)
  const costMicros = Number(m.cost_micros ?? 0)
  const cost = microsToCurrency(costMicros)
  const conversions = Number(m.conversions ?? 0)
  const conversionsValue = Number(m.all_conversions_value ?? 0)
  return {
    impressions, clicks,
    ctr: calculateCTR(clicks, impressions),
    costMicros, cost, conversions, conversionsValue,
    averageCpc: microsToCurrency(Number(m.average_cpc ?? 0)),
    cpa: calculateCPA(cost, conversions),
    roas: calculateROAS(conversionsValue, cost),
    searchImpressionShare: m.search_impression_share ? Number(m.search_impression_share) : undefined,
  }
}

export async function fetchCampaigns(customerId: string, dateRange: string): Promise<Campaign[]> {
  const q = 'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign_budget.amount_micros, campaign_budget.id, metrics.impressions, metrics.clicks, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.all_conversions_value FROM campaign WHERE segments.date DURING ' + dateRange + ' ORDER BY metrics.cost_micros DESC'
  const resp = await invokeEdgeFunction<{ results: Record<string, Record<string, string>>[] }>('google-ads-proxy', { action: 'search', customerId, query: q, userId: getUserId() })
  return (resp.results ?? []).map((row) => {
    const c = row.campaign ?? {}
    const b = row.campaign_budget ?? {}
    const budgetMicros = Number(b.amount_micros ?? 0)
    return { id: c.id, name: c.name, status: c.status as Campaign['status'], channelType: c.advertising_channel_type as Campaign['channelType'], biddingStrategy: c.bidding_strategy_type as Campaign['biddingStrategy'], budgetMicros, budget: microsToCurrency(budgetMicros), budgetId: b.id, metrics: parseMetrics(row) }
  })
}

export async function fetchAdGroups(customerId: string, dateRange: string, campaignId?: string): Promise<AdGroup[]> {
  let where = 'segments.date DURING ' + dateRange
  if (campaignId) where += ' AND campaign.id = ' + campaignId
  const q = 'SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.all_conversions_value FROM ad_group WHERE ' + where + ' ORDER BY metrics.cost_micros DESC'
  const resp = await invokeEdgeFunction<{ results: Record<string, Record<string, string>>[] }>('google-ads-proxy', { action: 'search', customerId, query: q, userId: getUserId() })
  return (resp.results ?? []).map((row) => {
    const ag = row.ad_group ?? {}
    const c = row.campaign ?? {}
    const cpcBidMicros = Number(ag.cpc_bid_micros ?? 0)
    return { id: ag.id, name: ag.name, status: ag.status as AdGroup['status'], campaignId: c.id, campaignName: c.name, cpcBidMicros, cpcBid: microsToCurrency(cpcBidMicros), metrics: parseMetrics(row) }
  })
}

export async function fetchAds(customerId: string, dateRange: string, adGroupId?: string): Promise<Ad[]> {
  let where = 'segments.date DURING ' + dateRange
  if (adGroupId) where += ' AND ad_group.id = ' + adGroupId
  const q = 'SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls, ad_group_ad.status, ad_group.id, ad_group.name, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.all_conversions_value FROM ad_group_ad WHERE ' + where + ' ORDER BY metrics.impressions DESC'
  const resp = await invokeEdgeFunction<{ results: Record<string, unknown>[] }>('google-ads-proxy', { action: 'search', customerId, query: q, userId: getUserId() })
  return (resp.results ?? []).map((row: Record<string, unknown>) => {
    const aga = (row.ad_group_ad as Record<string, unknown>) ?? {}
    const ad = (aga.ad as Record<string, unknown>) ?? {}
    const rsa = (ad.responsive_search_ad as Record<string, unknown[]>) ?? {}
    const ag = (row.ad_group as Record<string, string>) ?? {}
    const c = (row.campaign as Record<string, string>) ?? {}
    return {
      id: String(ad.id ?? ''), name: String(ad.name ?? ''),
      status: String(aga.status ?? 'ENABLED') as Ad['status'],
      adGroupId: String(ag.id ?? ''), adGroupName: String(ag.name ?? ''), campaignName: String(c.name ?? ''),
      finalUrls: (ad.final_urls as string[]) ?? [],
      headlines: ((rsa.headlines as Record<string, string>[]) ?? []).map((h) => ({ text: h.text, pinnedField: h.pinned_field as Ad['headlines'][0]['pinnedField'] })),
      descriptions: ((rsa.descriptions as Record<string, string>[]) ?? []).map((d) => ({ text: d.text, pinnedField: d.pinned_field as Ad['descriptions'][0]['pinnedField'] })),
      metrics: parseMetrics(row as Record<string, Record<string, string>>),
    }
  })
}

export async function fetchTimeSeries(customerId: string, dateRange: string): Promise<ChartDataPoint[]> {
  const q = 'SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.all_conversions_value FROM campaign WHERE segments.date DURING ' + dateRange + ' ORDER BY segments.date'
  const resp = await invokeEdgeFunction<{ results: Record<string, Record<string, string>>[] }>('google-ads-proxy', { action: 'search', customerId, query: q, userId: getUserId() })
  const byDate: Record<string, ChartDataPoint> = {}
  for (const row of resp.results ?? []) {
    const date = row.segments?.date ?? ''
    if (!byDate[date]) byDate[date] = { date, impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0, roas: 0 }
    const pt = byDate[date]
    pt.impressions += Number(row.metrics?.impressions ?? 0)
    pt.clicks += Number(row.metrics?.clicks ?? 0)
    pt.cost += microsToCurrency(Number(row.metrics?.cost_micros ?? 0))
    pt.conversions += Number(row.metrics?.conversions ?? 0)
    pt.roas = calculateROAS(Number(row.metrics?.all_conversions_value ?? 0), pt.cost)
    pt.ctr = calculateCTR(pt.clicks, pt.impressions)
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

export async function mutateCampaign(customerId: string, operation: 'create' | 'update' | 'remove', data: Record<string, unknown>) {
  return invokeEdgeFunction('google-ads-proxy', { action: 'mutate', customerId, resource: 'campaigns', operations: [{ [operation]: data }], userId: getUserId() })
}
export async function mutateAdGroup(customerId: string, operation: 'create' | 'update' | 'remove', data: Record<string, unknown>) {
  return invokeEdgeFunction('google-ads-proxy', { action: 'mutate', customerId, resource: 'adGroups', operations: [{ [operation]: data }], userId: getUserId() })
}
export async function mutateAd(customerId: string, operation: 'create' | 'update' | 'remove', data: Record<string, unknown>) {
  return invokeEdgeFunction('google-ads-proxy', { action: 'mutate', customerId, resource: 'adGroupAds', operations: [{ [operation]: data }], userId: getUserId() })
}
export async function pauseCampaign(customerId: string, campaignId: string) {
  return mutateCampaign(customerId, 'update', { resourceName: 'customers/' + customerId + '/campaigns/' + campaignId, status: 'PAUSED' })
}
export async function enableCampaign(customerId: string, campaignId: string) {
  return mutateCampaign(customerId, 'update', { resourceName: 'customers/' + customerId + '/campaigns/' + campaignId, status: 'ENABLED' })
}
export async function createBudget(customerId: string, amountMicros: number): Promise<string> {
  const resp = await invokeEdgeFunction<{ results: Array<{ resourceName: string }> }>('google-ads-proxy', { action: 'mutate', customerId, resource: 'campaignBudgets', operations: [{ create: { amountMicros, deliveryMethod: 'STANDARD' } }], userId: getUserId() })
  return resp.results?.[0]?.resourceName ?? ''
}
