import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v17'
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SB_SERVICE_KEY')!)

async function getAccessToken(userId: string): Promise<string> {
  const { data } = await supabase.from('oauth_tokens').select('*').eq('user_id', userId).single()
  if (!data) throw new Error('No token for ' + userId)
  const exp = new Date(data.expires_at).getTime()
  if (Date.now() >= exp - 60000) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: data.refresh_token, client_id: Deno.env.get('GOOGLE_CLIENT_ID')!, client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')! }),
    })
    const t = await r.json()
    await supabase.from('oauth_tokens').update({ access_token: t.access_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() }).eq('user_id', userId)
    return t.access_token
  }
  return data.access_token
}

async function getCampaignMetrics(token: string, customerId: string, campaignIds: string[] | null, metric: string, devToken: string): Promise<Record<string, number>> {
  const metricFields: Record<string, string> = { cpa: 'metrics.cost_micros,metrics.conversions', ctr: 'metrics.clicks,metrics.impressions', roas: 'metrics.cost_micros,metrics.all_conversions_value', cpc: 'metrics.average_cpc', impressions: 'metrics.impressions', clicks: 'metrics.clicks', cost: 'metrics.cost_micros', conversions: 'metrics.conversions' }
  let where = 'segments.date DURING LAST_7_DAYS AND campaign.status = ENABLED'
  if (campaignIds && campaignIds.length) where += ' AND campaign.id IN (' + campaignIds.join(',') + ')'
  const query = 'SELECT campaign.id,' + (metricFields[metric] || 'metrics.cost_micros') + ' FROM campaign WHERE ' + where
  const cleanId = customerId.replace(/-/g, '')
  const resp = await fetch(GOOGLE_ADS_BASE + '/customers/' + cleanId + '/googleAds:search', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'developer-token': devToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const data = await resp.json()
  const out: Record<string, number> = {}
  for (const row of data.results || []) {
    const id = row.campaign?.id
    const m = row.metrics
    if (!id || !m) continue
    const cost = Number(m.cost_micros || 0) / 1e6
    const conversions = Number(m.conversions || 0)
    const clicks = Number(m.clicks || 0)
    const impressions = Number(m.impressions || 0)
    const convVal = Number(m.all_conversions_value || 0)
    if (metric === 'cpa') out[id] = conversions > 0 ? cost / conversions : 0
    else if (metric === 'ctr') out[id] = impressions > 0 ? clicks / impressions : 0
    else if (metric === 'roas') out[id] = cost > 0 ? convVal / cost : 0
    else if (metric === 'cpc') out[id] = Number(m.average_cpc || 0) / 1e6
    else if (metric === 'impressions') out[id] = impressions
    else if (metric === 'clicks') out[id] = clicks
    else if (metric === 'cost') out[id] = cost
    else if (metric === 'conversions') out[id] = conversions
  }
  return out
}

function evalCond(val: number, op: string, thresh: number) {
  return op === '>' ? val > thresh : op === '<' ? val < thresh : op === '>=' ? val >= thresh : op === '<=' ? val <= thresh : op === '==' ? val === thresh : false
}

async function execAction(token: string, customerId: string, campaignId: string, action: string, devToken: string) {
  const cleanId = customerId.replace(/-/g, '')
  const rn = 'customers/' + cleanId + '/campaigns/' + campaignId
  if (action === 'pause' || action === 'enable') {
    const status = action === 'pause' ? 'PAUSED' : 'ENABLED'
    await fetch(GOOGLE_ADS_BASE + '/customers/' + cleanId + '/campaigns:mutate', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'developer-token': devToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ operations: [{ update: { resourceName: rn, status } }] }) })
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!
    const { data: rules } = await supabase.from('auto_rules').select('*,user_settings(customer_id)').eq('is_active', true)
    const processed: string[] = []
    for (const rule of rules || []) {
      try {
        const cid = (rule.user_settings as Record<string, string> | null)?.customer_id
        if (!cid) continue
        const token = await getAccessToken(rule.user_id)
        const metrics = await getCampaignMetrics(token, cid, rule.campaign_ids, rule.condition_metric, devToken)
        const affected: string[] = []
        for (const [campaignId, val] of Object.entries(metrics)) {
          if (evalCond(val, rule.condition_operator, rule.condition_value)) {
            await execAction(token, cid, campaignId, rule.action, devToken)
            affected.push(campaignId)
          }
        }
        if (affected.length > 0) {
          await supabase.from('auto_rules').update({ last_triggered_at: new Date().toISOString() }).eq('id', rule.id)
          await supabase.from('rule_logs').insert({ rule_id: rule.id, triggered_at: new Date().toISOString(), campaigns_affected: affected, action_taken: rule.action, details: {} })
          processed.push(rule.id)
        }
      } catch (e) { console.error('Rule error', rule.id, e) }
    }
    return new Response(JSON.stringify({ processed: processed.length }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
