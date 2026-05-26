import { useState } from 'react'
import { Copy, Check, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { invokeEdgeFunction } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'
import type { CopyGeneratorInput, CopyGeneratorResult } from '@/types'

export function CopyGenerator() {
  const [input, setInput] = useState<CopyGeneratorInput>({ product: '', audience: '', benefits: [], tone: 'professional' })
  const [benefitInput, setBenefitInput] = useState('')
  const [result, setResult] = useState<CopyGeneratorResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setInput(p => ({ ...p, benefits: [...p.benefits, benefitInput.trim()] }))
      setBenefitInput('')
    }
  }

  const generate = async () => {
    setIsLoading(true)
    try {
      const resp = await invokeEdgeFunction<CopyGeneratorResult>('claude-ai', { mode: 'copy', userId: getCurrentUserId(), input })
      setResult(resp)
    } catch {
      alert('Erro ao gerar copy. Verifique a configuracao da API.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-5 w-5 text-purple-500" />Gerador de Copy com IA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Produto ou servico</Label>
            <Input value={input.product} onChange={e => setInput(p => ({ ...p, product: e.target.value }))} placeholder="Ex: Software de gestao financeira" />
          </div>
          <div className="space-y-2">
            <Label>Publico-alvo</Label>
            <Input value={input.audience} onChange={e => setInput(p => ({ ...p, audience: e.target.value }))} placeholder="Ex: PMEs que buscam controle financeiro" />
          </div>
          <div className="space-y-2">
            <Label>Diferenciais</Label>
            <div className="flex gap-2">
              <Input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBenefit()} placeholder="Ex: Frete gratis" />
              <Button type="button" variant="outline" onClick={addBenefit}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {input.benefits.map((b, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  {b}
                  <button onClick={() => setInput(p => ({ ...p, benefits: p.benefits.filter((_, idx) => idx !== i) }))} className="hover:text-red-600">x</button>
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <Select value={input.tone} onValueChange={v => setInput(p => ({ ...p, tone: v as CopyGeneratorInput['tone'] }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="friendly">Amigavel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={isLoading || !input.product} className="w-full">
            {isLoading ? 'Gerando...' : 'Gerar Titulos e Descricoes'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Titulos ({result.headlines.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {result.headlines.map((h, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="flex-1 text-sm p-2 bg-gray-50 rounded border">
                    <span>{h}</span>
                    <span className="text-xs text-gray-400 ml-2">({h.length}/30)</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => copyText(h, 'h' + i)}>
                    {copied === 'h' + i ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Descricoes ({result.descriptions.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {result.descriptions.map((d, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <div className="flex-1 text-sm p-2 bg-gray-50 rounded border">
                    <p>{d}</p>
                    <span className="text-xs text-gray-400">({d.length}/90)</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => copyText(d, 'd' + i)}>
                    {copied === 'd' + i ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
