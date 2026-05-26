import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'
import type { AutoRule, RuleLog } from '@/types'

export function useRules() {
  const userId = getCurrentUserId()
  return useQuery({
    queryKey: ['rules', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AutoRule[]
    },
    enabled: !!userId,
  })
}

export function useRuleLogs() {
  const userId = getCurrentUserId()
  return useQuery({
    queryKey: ['ruleLogs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rule_logs')
        .select('*, auto_rules(name)')
        .order('triggered_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []).map((r) => ({
        ...r,
        ruleName: (r.auto_rules as { name: string } | null)?.name,
      })) as RuleLog[]
    },
    enabled: !!userId,
  })
}

export function useCreateRule() {
  const qc = useQueryClient()
  const userId = getCurrentUserId()
  return useMutation({
    mutationFn: async (rule: Omit<AutoRule, 'id' | 'userId' | 'createdAt' | 'lastTriggeredAt'>) => {
      const { data, error } = await supabase.from('auto_rules').insert({
        user_id: userId,
        name: rule.name,
        condition_metric: rule.conditionMetric,
        condition_operator: rule.conditionOperator,
        condition_value: rule.conditionValue,
        action: rule.action,
        action_value: rule.actionValue,
        campaign_ids: rule.campaignIds,
        is_active: rule.isActive,
      }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useToggleRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('auto_rules').update({ is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auto_rules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}
