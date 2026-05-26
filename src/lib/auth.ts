import { supabase, invokeEdgeFunction } from './supabase'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const REDIRECT_URI = `${window.location.origin}/auth/callback`
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/adwords',
].join(' ')

export function initiateGoogleOAuth() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('oauth_state', state)
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function handleOAuthCallback(code: string, state: string): Promise<string> {
  const savedState = sessionStorage.getItem('oauth_state')
  if (state !== savedState) throw new Error('OAuth state mismatch')
  sessionStorage.removeItem('oauth_state')

  const result = await invokeEdgeFunction<{ userId: string; customerId?: string }>(
    'google-ads-proxy',
    { action: 'exchange_token', code, redirectUri: REDIRECT_URI }
  )

  localStorage.setItem('gam_user_id', result.userId)
  if (result.customerId) localStorage.setItem('gam_customer_id', result.customerId)
  return result.userId
}

export async function refreshAccessToken(userId: string): Promise<void> {
  await invokeEdgeFunction('google-ads-proxy', { action: 'refresh_token', userId })
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem('gam_user_id')
}

export function getCurrentCustomerId(): string | null {
  return localStorage.getItem('gam_customer_id')
}

export function setCustomerId(id: string) {
  localStorage.setItem('gam_customer_id', id)
}

export async function signOut() {
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await supabase.from('oauth_tokens').delete().eq('user_id', userId)
    } catch (_) {}
  }
  localStorage.removeItem('gam_user_id')
  localStorage.removeItem('gam_customer_id')
}

export async function getUserInfo(userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}
