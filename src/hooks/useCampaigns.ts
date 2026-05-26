import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCampaigns, pauseCampaign, enableCampaign, mutateCampaign, createBudget } from '@/lib/google-ads'
import { invokeEdgeFunction } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'
import { currencyToMicros } from '@/lib/utils'
import type { Campaign } from '@/types'

export function useCampaigns(customerId: string | null, dateRange: string) {
  return useQuery({
    queryKey: ['campaigns', customerId, dateRange],
    queryFn: () => fetchCampaigns(customerId!, dateRange),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePauseCampaign(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => pauseCampaign(customerId!, campaignId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', customerId] }),
  })
}

export function useEnableCampaign(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => enableCampaign(customerId!, campaignId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', customerId] }),
  })
}

interface CreateCampaignInput {
  name: string
  status: Campaign['status']
  channelType: Campaign['channelType']
  biddingStrategy: Campaign['biddingStrategy']
  dailyBudget: number
  targetCpa?: number
  targetRoas?: number
}

export function useCreateCampaign(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const budgetResource = await createBudget(customerId!, currencyToMicros(input.dailyBudget))
      const campaignData: Record<string, unknown> = {
        name: input.name,
        status: input.status,
        advertisingChannelType: input.channelType,
        campaignBudget: budgetResource,
      }
      if (input.biddingStrategy === 'TARGET_CPA' && input.targetCpa) {
        campaignData.targetCpa = { targetCpaMicros: currencyToMicros(input.targetCpa) }
      } else if (input.biddingStrategy === 'TARGET_ROAS' && input.targetRoas) {
        campaignData.targetRoas = { targetRoas: input.targetRoas }
      } else if (input.biddingStrategy === 'MAXIMIZE_CONVERSIONS') {
        campaignData.maximizeConversions = {}
      } else if (input.biddingStrategy === 'MAXIMIZE_CONVERSION_VALUE') {
        campaignData.maximizeConversionValue = {}
      } else {
        campaignData.manualCpc = { enhancedCpcEnabled: false }
      }
      return mutateCampaign(customerId!, 'create', campaignData)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', customerId] }),
  })
}

interface UpdateCampaignInput {
  campaignId: string
  name?: string
  status?: Campaign['status']
  dailyBudget?: number
  budgetId?: string
}

export function useUpdateCampaign(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateCampaignInput) => {
      const ops: Promise<unknown>[] = []
      if (input.name || input.status) {
        const data: Record<string, unknown> = {
          resourceName: 'customers/' + customerId + '/campaigns/' + input.campaignId,
        }
        if (input.name) data.name = input.name
        if (input.status) data.status = input.status
        ops.push(mutateCampaign(customerId!, 'update', data))
      }
      if (input.dailyBudget !== undefined && input.budgetId) {
        ops.push(invokeEdgeFunction('google-ads-proxy', {
          action: 'mutate', customerId,
          resource: 'campaignBudgets',
          operations: [{ update: { resourceName: 'customers/' + customerId + '/campaignBudgets/' + input.budgetId, amountMicros: currencyToMicros(input.dailyBudget) } }],
          userId: getCurrentUserId(),
        }))
      }
      return Promise.all(ops)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', customerId] }),
  })
}
