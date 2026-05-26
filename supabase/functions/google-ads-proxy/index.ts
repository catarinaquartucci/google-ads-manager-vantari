import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v17'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SB_SERVICE_KEY')!
)

async function getTokens(userId: string) {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error || !data) throw new Error('Token not found for user: ' + userId)
  return data
}

async function refreshToken(userId: string, refreshToken: string): Promise<string> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    }),
  })
  const data = await resp.json()
  if (!data.access_token) throw new Error('Failed to refresh token: ' + JSON.stringify(data))
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
  await supabase.from('oauth_tokens').update({
    access_token: data.access_token,
    expires_at: expiresAt,
  }).eq('user_id', userId)
  return data.access_token
}

async function getValidAccessToken(userId: string): Promise<string> {
  const tokenData = await getTokens(userId)
  const expiresAt = new Date(tokenData.expires_at).getTime()
  if (Date.now() >= expiresAt - 60000) {
    return await refreshToken(userId, tokenData.refresh_token)
  }
  return tokenData.access_token
}

async function exchangeToken(code: string, redirectUri: string) {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    }),
  })
  const data = await resp.json()
  if (!data.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(data))

  const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: 'Bearer ' + data.access_token },
  })
  const userInfo = await userInfoResp.json()
  const userId = userInfo.id || userInfo.sub

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString()
  await supabase.from('oauth_tokens').upsert({
    user_id: userId,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scope: data.scope,
    customer_id: '',
  }, { onConflict: 'user_id' })

  await supabase.from('user_settings').upsert({
    user_id: userId,
    settings: { email: userInfo.email, name: userInfo.name },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return { userId, email: userInfo.email }
}

async function searchGoogleAds(accessToken: string, customerId: string, query: string, managerId?: string) {
  const cleanId = customerId.replace(/-/g, '')
  const url = GOOGLE_ADS_BASE + '/customers/' + cleanId + '/googleAds:search'
  const headers: Record<string, string> = {
    'Authorization': 'Bearer ' + accessToken,
    'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
    'Content-Type': 'application/json',
  }
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '')
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(JSON.stringify(data.error ?? data))
  return data
}

async function mutateGoogleAds(accessToken: string, customerId: string, resource: string, operations: unknown[], managerId?: string) {
  const cleanId = customerId.replace(/-/g, '')
  const url = GOOGLE_ADS_BASE + '/customers/' + cleanId + '/' + resource + ':mutate'
  const headers: Record<string, string> = {
    'Authorization': 'Bearer ' + accessToken,
    'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
    'Content-Type': 'application/json',
  }
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '')
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ operations }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(JSON.stringify(data.error ?? data))
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const body = await req.json()
    const { action, userId, customerId, query, resource, operations, code, redirectUri } = body

    if (action === 'exchange_token') {
      const result = await exchangeToken(code, redirectUri)
      return new Response(JSON.stringify(result), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    if (action === 'refresh_token') {
      const tokenData = await getTokens(userId)
      await refreshToken(userId, tokenData.refresh_token)
      return new Response(JSON.stringify({ success: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const { data: settings } = await supabase.from('user_settings').select('manager_customer_id').eq('user_id', userId).single()
    const managerId = settings?.manager_customer_id
    const accessToken = await getValidAccessToken(userId)

    if (action === 'search') {
      const result = await searchGoogleAds(accessToken, customerId, query, managerId)
      return new Response(JSON.stringify(result), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    if (action === 'mutate') {
      const result = await mutateGoogleAds(accessToken, customerId, resource, operations, managerId)
      return new Response(JSON.stringify(result), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action: ' + action }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
