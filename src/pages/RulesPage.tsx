import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useRules, useRuleLogs, useCreateRule, useToggleRule, useDeleteRule } from '@/hooks/useRules'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import type { RuleMetric, RuleOperator, RuleAction } from '@/types'

const METRIC_LABELS: Record<string, string> = {
  cpa: 'CPA', ctr: 'CTR', roas: 'ROAS', cpc: 'CPC',
  impressions: 'Impressoes', clicks: 'Cliques', cost: 'Custo', conversions: 'Conversoes',
}
const ACTION_LABELS: Record<string, string> = {
  pause: 'Pausar campanha',
  enable: 'Ativar campanha',
  increase_budget_10pct: 'Aumentar orcamento 10%',
  decrease_budget_10pct: 'Diminuir orcamento 10%',
  set_budget: 'Definir orcamento',
}

export function RulesPage() {
  const { data: rules = [] } = useRules()
  const { data: logs = [] } = useRuleLogs()
  const { mutateAsync: createRule, isPending } = useCreateRule()
  const { mutate: toggleRule } = useToggleRule()
  const { mutate: deleteRule } = useDeleteRule()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', conditionMetric: 'cpa' as RuleMetric, conditionOperator: '>' as RuleOperator,
    conditionValue: 50, action: 'pause' as RuleAction, actionValue: 0, isActive: true,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRule({ ...form, campaignIds: null })
      toast({ title: 'Regra criada' })
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: String(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Regras Automaticas ({rules.length})</h2>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Regra</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regra</TableHead>
              <TableHead>Condicao</TableHead>
              <TableHead>Acao</TableHead>
              <TableHead>Ultimo disparo</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Nenhuma regra configurada</TableCell></TableRow>
            )}
            {rules.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm">{METRIC_LABELS[r.conditionMetric]} {r.conditionOperator} {r.conditionValue}</TableCell>
                <TableCell className="text-sm">{ACTION_LABELS[r.action]}</TableCell>
                <TableCell className="text-sm text-gray-500">{r.lastTriggeredAt ? format(new Date(r.lastTriggeredAt), 'dd/MM/yy HH:mm') : 'Nunca'}</TableCell>
                <TableCell><Switch checked={r.isActive} onCheckedChange={v => toggleRule({ id: r.id, isActive: v })} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteRule(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Historico</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Regra</TableHead><TableHead>Disparado</TableHead><TableHead>Acao</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.ruleName}</TableCell>
                    <TableCell className="text-sm">{format(new Date(l.triggeredAt), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-sm">{l.actionTaken}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Regra Automatica</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Pausar se CPA alto" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Metrica</Label>
                <Select value={form.conditionMetric} onValueChange={v => setForm(p => ({ ...p, conditionMetric: v as RuleMetric }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(METRIC_LABELS).map(m => <SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operador</Label>
                <Select value={form.conditionOperator} onValueChange={v => setForm(p => ({ ...p, conditionOperator: v as RuleOperator }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['>', '<', '>=', '<=', '=='].map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" value={form.conditionValue} onChange={e => setForm(p => ({ ...p, conditionValue: parseFloat(e.target.value) }))} required min="0" step="0.01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Acao</Label>
              <Select value={form.action} onValueChange={v => setForm(p => ({ ...p, action: v as RuleAction }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(ACTION_LABELS).map(a => <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.action === 'set_budget' && (
              <div className="space-y-2">
                <Label>Novo orcamento (R$)</Label>
                <Input type="number" min="1" step="0.01" value={form.actionValue} onChange={e => setForm(p => ({ ...p, actionValue: parseFloat(e.target.value) }))} required />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Criando...' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
