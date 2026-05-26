import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callClaude(systemPrompt: string, userMessage: string, history: Array<{role: string; content: string}> = []) {
  const messages = [...history.map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }]
  const resp = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(JSON.stringify(data.error ?? data))
  return data.content[0].text as string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const body = await req.json()
    const { mode } = body

    if (mode === 'analyze') {
      const { context, question, history } = body
      const system = `Voce e um especialista em Google Ads e marketing digital. Analise os dados da conta e responda de forma objetiva e pratica em portugues brasileiro. Foque em insights acionaveis.

Dados da conta:
${context}`
      const response = await callClaude(system, question, history)
      return new Response(JSON.stringify({ response }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    if (mode === 'copy') {
      const { input } = body
      const system = 'Voce e um copywriter especialista em Google Ads. Crie copys de alta conversao seguindo as diretrizes da plataforma.'
      const prompt = `Crie copies para Google Ads RSA com as seguintes especificacoes:
Produto/Servico: ${input.product}
Publico-alvo: ${input.audience}
Diferenciais: ${(input.benefits || []).join(', ')}
Tom: ${input.tone}

RETORNE APENAS JSON valido no formato:
{
  "headlines": ["titulo1", "titulo2", ... (15 titulos, maximo 30 caracteres cada)],
  "descriptions": ["desc1", "desc2", "desc3", "desc4" (4 descricoes, maximo 90 caracteres cada)]
}

Cada titulo deve ter no maximo 30 caracteres. Cada descricao no maximo 90 caracteres. Nao use emojis.`
      const raw = await callClaude(system, prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Claude did not return valid JSON')
      const parsed = JSON.parse(jsonMatch[0])
      return new Response(JSON.stringify(parsed), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    if (mode === 'fatigue') {
      const { campaigns } = body
      const system = 'Voce e um especialista em performance de midia paga. Analise dados de campanhas e identifique fadiga criativa.'
      const campaignData = campaigns.map((c: Record<string, unknown>) =>
        `${c.name}: CTR=${(Number(c.ctr) * 100).toFixed(2)}%, Impressoes=${c.impressions}, Status=${c.status}`
      ).join('\n')
      const prompt = `Analise estas campanhas e identifique fadiga criativa (CTR abaixo da media do setor ou em declinio):

${campaignData}

RETORNE APENAS JSON no formato:
{
  "reports": [
    {
      "campaignId": "id",
      "campaignName": "nome",
      "ctrWeek1": 0.05,
      "ctrWeek4": 0.03,
      "change": -40,
      "severity": "high",
      "recommendation": "texto em portugues"
    }
  ]
}

Inclua apenas campanhas com potencial fadiga. severity pode ser: low, medium, high. Se nao houver fadiga, retorne reports: [].`
      const raw = await callClaude(system, prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reports: [] }
      return new Response(JSON.stringify(parsed), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown mode' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
