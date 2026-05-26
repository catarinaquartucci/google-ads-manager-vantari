import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Campaign } from '@/types'

interface ScaleCalculatorProps {
  campaigns: Campaign[]
}

export function ScaleCalculator({ campaigns }: ScaleCalculatorProps) {
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalCost = campaigns.reduce((s, c) => s + c.metrics.cost, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0)
  const totalConv = campaigns.reduce((s, c) => s + c.metrics.conversions, 0)
  const totalConvVal = campaigns.reduce((s, c) => s + c.metrics.conversionsValue, 0)

  const [targetMultiplier, setTargetMultiplier] = useState(2)
  const [targetBudget, setTargetBudget] = useState(totalBudget * 2)

  const efficiencyDecay = 0.92

  const projections = useMemo(() => {
    const steps = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]
    return steps.map(mult => {
      const budgetVal = totalBudget * mult
      const costScale = Math.pow(efficiencyDecay, Math.log2(mult))
      const projCost = totalCost * mult * costScale
      const projClicks = totalClicks * mult * costScale
      const projConv = totalConv * mult * Math.pow(costScale, 1.2)
      const projConvVal = totalConvVal * mult * Math.pow(costScale, 1.2)
      const projRoas = projCost > 0 ? projConvVal / projCost : 0
      return { budget: budgetVal, cost: projCost, clicks: projClicks, conversions: projConv, roas: projRoas, mult }
    })
  }, [totalBudget, totalCost, totalClicks, totalConv, totalConvVal])

  const target = projections.find(p => Math.abs(p.mult - targetMultiplier) < 0.01) ?? projections[projections.length - 1]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-5 w-5 text-green-500" />Calculadora de Escala</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Orcamento atual/dia</p>
              <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gasto atual (periodo)</p>
              <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Multiplicador de orcamento: {targetMultiplier}x</Label>
            <Slider
              min={1}
              max={5}
              step={0.25}
              value={[targetMultiplier]}
              onValueChange={([v]) => { setTargetMultiplier(v); setTargetBudget(totalBudget * v) }}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1x</span><span>2x</span><span>3x</span><span>4x</span><span>5x</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-xs text-blue-600 font-medium">Orcamento alvo/dia</p>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(targetBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Cliques projetados</p>
              <p className="text-xl font-bold text-blue-800">{formatNumber(target?.clicks ?? 0, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Conversoes projetadas</p>
              <p className="text-xl font-bold text-blue-800">{formatNumber(target?.conversions ?? 0, 1)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">ROAS projetado</p>
              <p className="text-xl font-bold text-blue-800">{(target?.roas ?? 0).toFixed(2)}x</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
            Nota: A projecao considera uma queda natural de eficiencia ao escalar (lei dos retornos decrescentes). ROAS tende a diminuir levemente ao aumentar o orcamento.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Curva de Projecao</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projections} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mult" tickFormatter={v => v + 'x'} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, name: string) => name === 'conversions' ? [formatNumber(v, 1), 'Conversoes'] : [formatCurrency(v), 'Custo']} labelFormatter={v => 'Multiplicador: ' + v + 'x'} />
              <Bar dataKey="cost" name="Custo" fill="#6366f1" />
              <Bar dataKey="conversions" name="Conversoes" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
