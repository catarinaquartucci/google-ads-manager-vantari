import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdGroups, mutateAdGroup } from '@/lib/google-ads'
import { currencyToMicros } from '@/lib/utils'
import type { AdGroup } from '@/types'

export function useAdGroups(customerId: string | null, dateRange: string, campaignId?: string) {
  return useQuery({
    queryKey: ['adGroups', customerId, dateRange, campaignId],
    queryFn: () => fetchAdGroups(customerId!, dateRange, campaignId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })
}

interface CreateAdGroupInput {
  name: string
  campaignId: string
  status: AdGroup['status']
  cpcBid: number
}

export function useCreateAdGroup(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdGroupInput) =>
      mutateAdGroup(customerId!, 'create', {
        name: input.name,
        campaign: 'customers/' + customerId + '/campaigns/' + input.campaignId,
        status: input.status,
        cpcBidMicros: currencyToMicros(input.cpcBid),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adGroups', customerId] }),
  })
}

interface UpdateAdGroupInput {
  adGroupId: string
  name?: string
  status?: AdGroup['status']
  cpcBid?: number
}

export function useUpdateAdGroup(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAdGroupInput) => {
      const data: Record<string, unknown> = {
        resourceName: 'customers/' + customerId + '/adGroups/' + input.adGroupId,
      }
      if (input.name) data.name = input.name
      if (input.status) data.status = input.status
      if (input.cpcBid !== undefined) data.cpcBidMicros = currencyToMicros(input.cpcBid)
      return mutateAdGroup(customerId!, 'update', data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adGroups', customerId] }),
  })
}

export function usePauseAdGroup(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (adGroupId: string) =>
      mutateAdGroup(customerId!, 'update', {
        resourceName: 'customers/' + customerId + '/adGroups/' + adGroupId,
        status: 'PAUSED',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adGroups', customerId] }),
  })
}
