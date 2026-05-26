// ─── Enums ───────────────────────────────────────────────────────────────────

export type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED'
export type AdGroupStatus = 'ENABLED' | 'PAUSED' | 'REMOVED'
export type AdStatus = 'ENABLED' | 'PAUSED' | 'REMOVED'
export type ChannelType = 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'VIDEO' | 'PERFORMANCE_MAX'
export type BiddingStrategy =
  | 'MANUAL_CPC'
  | 'TARGET_CPA'
  | 'TARGET_ROAS'
  | 'MAXIMIZE_CONVERSIONS'
  | 'MAXIMIZE_CONVERSION_VALUE'
  | 'TARGET_IMPRESSION_SHARE'

export type RuleMetric = 'cpa' | 'ctr' | 'roas' | 'cpc' | 'impressions' | 'clicks' | 'cost' | 'conversions'
export type RuleOperator = '>' | '<' | '>=' | '<=' | '=='
export type RuleAction = 'pause' | 'enable' | 'increase_budget_10pct' | 'decrease_budget_10pct' | 'set_budget'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Metrics {
  impressions: number
  clicks: number
  ctr: number
  costMicros: number
  cost: number
  conversions: number
  conversionsValue: number
  averageCpc: number
  cpa: number
  roas: number
  searchImpressionShare?: number
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  channelType: ChannelType
  biddingStrategy: BiddingStrategy
  budgetMicros: number
  budget: number
  budgetId: string
  targetCpa?: number
  targetRoas?: number
  metrics: Metrics
}

export interface AdGroup {
  id: string
  name: string
  status: AdGroupStatus
  campaignId: string
  campaignName: string
  cpcBidMicros: number
  cpcBid: number
  metrics: Metrics
}

export interface AdHeadline {
  text: string
  pinnedField?: 'HEADLINE_1' | 'HEADLINE_2' | 'HEADLINE_3'
}

export interface AdDescription {
  text: string
  pinnedField?: 'DESCRIPTION_1' | 'DESCRIPTION_2'
}

export interface Ad {
  id: string
  name: string
  status: AdStatus
  adGroupId: string
  adGroupName: string
  campaignName: string
  finalUrls: string[]
  headlines: AdHeadline[]
  descriptions: AdDescription[]
  path1?: string
  path2?: string
  metrics: Metrics
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date
  to: Date
  label: string
  gaqlRange: string
}

export interface ChartDataPoint {
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  roas: number
}

export interface PeriodMetrics {
  label: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  roas: number
  cpa: number
  cpc: number
}

export interface PeriodComparison {
  current: PeriodMetrics
  previous: PeriodMetrics
}

// ─── Auto Rules ──────────────────────────────────────────────────────────────

export interface AutoRule {
  id: string
  userId: string
  name: string
  conditionMetric: RuleMetric
  conditionOperator: RuleOperator
  conditionValue: number
  action: RuleAction
  actionValue?: number
  campaignIds: string[] | null
  isActive: boolean
  lastTriggeredAt?: string
  createdAt: string
}

export interface RuleLog {
  id: string
  ruleId: string
  ruleName?: string
  triggeredAt: string
  campaignsAffected: string[]
  actionTaken: string
  details: Record<string, unknown>
}

// ─── User / Auth ─────────────────────────────────────────────────────────────

export interface UserSettings {
  userId: string
  customerId: string
  managerCustomerId?: string
  settings: Record<string, unknown>
}

export interface OAuthToken {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: string
  scope: string
  customerId: string
}

// ─── AI Features ─────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface CopyGeneratorInput {
  product: string
  audience: string
  benefits: string[]
  tone: 'professional' | 'casual' | 'urgent' | 'friendly'
  landingPageUrl?: string
}

export interface CopyGeneratorResult {
  headlines: string[]
  descriptions: string[]
}

export interface ScaleProjection {
  currentBudget: number
  targetBudget: number
  currentMetrics: Metrics
  projectedMetrics: Metrics
  scaleFactor: number
  efficiencyNote: string
  chartData: Array<{
    budget: number
    impressions: number
    clicks: number
    conversions: number
    cost: number
    roas: number
  }>
}

export interface CreativeFatigueReport {
  campaignId: string
  campaignName: string
  ctrWeek1: number
  ctrWeek4: number
  change: number
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface GoogleAdsSearchResponse {
  results: Record<string, unknown>[]
  nextPageToken?: string
  totalResultsCount?: string
}
