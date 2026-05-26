import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { DateRange } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function microsToCurrency(micros: number): number {
  return micros / 1_000_000
}

export function currencyToMicros(amount: number): number {
  return Math.round(amount * 1_000_000)
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${formatNumber(value * 100, decimals)}%`
}

export function calculateROAS(conversionValue: number, cost: number): number {
  if (cost === 0) return 0
  return conversionValue / cost
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return clicks / impressions
}

export function calculateCPC(cost: number, clicks: number): number {
  if (clicks === 0) return 0
  return cost / clicks
}

export function calculateCPA(cost: number, conversions: number): number {
  if (conversions === 0) return 0
  return cost / conversions
}

export function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ENABLED': return 'default'
    case 'PAUSED': return 'secondary'
    case 'REMOVED': return 'destructive'
    default: return 'outline'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ENABLED': return 'Ativo'
    case 'PAUSED': return 'Pausado'
    case 'REMOVED': return 'Removido'
    default: return status
  }
}

export function channelTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SEARCH: 'Pesquisa',
    DISPLAY: 'Display',
    SHOPPING: 'Shopping',
    VIDEO: 'Vídeo',
    PERFORMANCE_MAX: 'Performance Max',
  }
  return map[type] ?? type
}

export function biddingStrategyLabel(strategy: string): string {
  const map: Record<string, string> = {
    MANUAL_CPC: 'CPC Manual',
    TARGET_CPA: 'CPA Alvo',
    TARGET_ROAS: 'ROAS Alvo',
    MAXIMIZE_CONVERSIONS: 'Maximizar Conversões',
    MAXIMIZE_CONVERSION_VALUE: 'Maximizar Valor',
    TARGET_IMPRESSION_SHARE: 'Quota de Impressões',
  }
  return map[strategy] ?? strategy
}

export function getPresetDateRanges(): DateRange[] {
  const now = new Date()
  return [
    {
      label: 'Últimos 7 dias',
      from: startOfDay(subDays(now, 7)),
      to: endOfDay(subDays(now, 1)),
      gaqlRange: 'LAST_7_DAYS',
    },
    {
      label: 'Últimos 14 dias',
      from: startOfDay(subDays(now, 14)),
      to: endOfDay(subDays(now, 1)),
      gaqlRange: 'LAST_14_DAYS',
    },
    {
      label: 'Últimos 30 dias',
      from: startOfDay(subDays(now, 30)),
      to: endOfDay(subDays(now, 1)),
      gaqlRange: 'LAST_30_DAYS',
    },
    {
      label: 'Últimos 90 dias',
      from: startOfDay(subDays(now, 90)),
      to: endOfDay(subDays(now, 1)),
      gaqlRange: 'LAST_90_DAYS',
    },
  ]
}

export function formatDateForGAQL(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}
