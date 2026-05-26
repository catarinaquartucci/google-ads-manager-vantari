import { useState, useEffect, useCallback } from 'react'
import { getCurrentUserId, getCurrentCustomerId, setCustomerId, signOut as authSignOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface AuthState {
  userId: string | null
  customerId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    customerId: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const userId = getCurrentUserId()
    const customerId = getCurrentCustomerId()
    setState({ userId, customerId, isAuthenticated: !!userId, isLoading: false })
  }, [])

  const updateCustomerId = useCallback((id: string) => {
    setCustomerId(id)
    setState((prev) => ({ ...prev, customerId: id }))
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setState({ userId: null, customerId: null, isAuthenticated: false, isLoading: false })
  }, [])

  const refreshUserInfo = useCallback(async () => {
    const userId = getCurrentUserId()
    if (!userId) return
    const { data } = await supabase
      .from('user_settings')
      .select('customer_id')
      .eq('user_id', userId)
      .single()
    if (data?.customer_id) {
      setCustomerId(data.customer_id)
      setState((prev) => ({ ...prev, customerId: data.customer_id }))
    }
  }, [])

  return { ...state, updateCustomerId, signOut, refreshUserInfo }
}
