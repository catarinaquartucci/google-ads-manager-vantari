import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { invokeEdgeFunction } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'
import type { AIMessage, Campaign } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface AIAssistantProps {
  campaigns: Campaign[]
  customerId: string | null
}

export function AIAssistant({ campaigns, customerId }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Ola! Sou seu assistente de Google Ads com IA. Posso analisar suas campanhas, identificar problemas e sugerir otimizacoes. O que voce gostaria de saber?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = () => {
    if (!campaigns.length) return 'Nenhuma campanha encontrada.'
    const totalCost = campaigns.reduce((s, c) => s + c.metrics.cost, 0)
    const totalConv = campaigns.reduce((s, c) => s + c.metrics.conversions, 0)
    const totalConvVal = campaigns.reduce((s, c) => s + c.metrics.conversionsValue, 0)
    const roas = totalCost > 0 ? totalConvVal / totalCost : 0
    const top3 = [...campaigns].sort((a, b) => b.metrics.roas - a.metrics.roas).slice(0, 3)
    const bottom3 = [...campaigns].sort((a, b) => a.metrics.roas - b.metrics.roas).slice(0, 3)
    return [
      `Conta: ${customerId ?? 'N/A'}`,
      `Total investido: ${formatCurrency(totalCost)}`,
      `ROAS medio: ${roas.toFixed(2)}x`,
      `Total conversoes: ${totalConv.toFixed(1)}`,
      ``,
      `Top 3 campanhas (ROAS):`,
      ...top3.map(c => `  - ${c.name}: ROAS ${c.metrics.roas.toFixed(2)}x, gasto ${formatCurrency(c.metrics.cost)}, CTR ${formatPercentage(c.metrics.ctr)}`),
      ``,
      `Bottom 3 campanhas (ROAS):`,
      ...bottom3.map(c => `  - ${c.name}: ROAS ${c.metrics.roas.toFixed(2)}x, gasto ${formatCurrency(c.metrics.cost)}, status ${c.status}`),
    ].join('\n')
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: AIMessage = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    try {
      const resp = await invokeEdgeFunction<{ response: string }>('claude-ai', {
        mode: 'analyze',
        userId: getCurrentUserId(),
        context: buildContext(),
        question: input,
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: resp.response, timestamp: new Date() }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA. Verifique a configuracao da API.', timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-blue-500" />
          Assistente de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-gray-600" />}
              </div>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Pergunte sobre suas campanhas... (Enter para enviar)"
            className="min-h-[40px] max-h-24 resize-none text-sm"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
