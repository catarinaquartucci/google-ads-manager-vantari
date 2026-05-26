import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAds, mutateAd } from '@/lib/google-ads'
import type { Ad } from '@/types'

export function useAds(customerId: string | null, dateRange: string, adGroupId?: string) {
  return useQuery({
    queryKey: ['ads', customerId, dateRange, adGroupId],
    queryFn: () => fetchAds(customerId!, dateRange, adGroupId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })
}

interface CreateAdInput {
  adGroupId: string
  finalUrl: string
  headlines: Array<{ text: string; pinnedField?: string }>
  descriptions: Array<{ text: string; pinnedField?: string }>
  path1?: string
  path2?: string
}

export function useCreateAd(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdInput) =>
      mutateAd(customerId!, 'create', {
        adGroup: 'customers/' + customerId + '/adGroups/' + input.adGroupId,
        status: 'ENABLED',
        ad: {
          finalUrls: [input.finalUrl],
          responsiveSearchAd: {
            headlines: input.headlines.map((h) => ({ text: h.text, ...(h.pinnedField ? { pinnedField: h.pinnedField } : {}) })),
            descriptions: input.descriptions.map((d) => ({ text: d.text, ...(d.pinnedField ? { pinnedField: d.pinnedField } : {}) })),
            path1: input.path1,
            path2: input.path2,
          },
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads', customerId] }),
  })
}

export function useUpdateAdStatus(customerId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ adId, adGroupId, status }: { adId: string; adGroupId: string; status: Ad['status'] }) =>
      mutateAd(customerId!, 'update', {
        resourceName: 'customers/' + customerId + '/adGroupAds/' + adGroupId + '~' + adId,
        status,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads', customerId] }),
  })
}
