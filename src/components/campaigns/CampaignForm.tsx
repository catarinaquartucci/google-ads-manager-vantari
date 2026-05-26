import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Campaign } from '@/types'

interface CampaignFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign
  onSubmit: (data: CampaignFormData) => void
  isLoading?: boolean
}

export interface CampaignFormData {
  name: string
  status: Campaign['status']
  channelType: Campaign['channelType']
  biddingStrategy: Campaign['biddingStrategy']
  dailyBudget: number
  targetCpa?: number
  targetRoas?: number
}

export function CampaignForm({ open, onOpenChange, campaign, onSubmit, isLoading }: CampaignFormProps) {
  const [form, setForm] = useState<CampaignFormData>({
    name: campaign?.name ?? '',
    status: campaign?.status ?? 'ENABLED',
    channelType: campaign?.channelType ?? 'SEARCH',
    biddingStrategy: campaign?.biddingStrategy ?? 'MANUAL_CPC',
    dailyBudget: campaign?.budget ?? 50,
    targetCpa: campaign?.targetCpa,
    targetRoas: campaign?.targetRoas,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const set = (key: keyof CampaignFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da campanha</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ex: Marca - Search" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENABLED">Ativo</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de canal</Label>
              <Select value={form.channelType} onValueChange={(v) => set('channelType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEARCH">Pesquisa</SelectItem>
                  <SelectItem value="DISPLAY">Display</SelectItem>
                  <SelectItem value="SHOPPING">Shopping</SelectItem>
                  <SelectItem value="VIDEO">Vídeo</SelectItem>
                  <SelectItem value="PERFORMANCE_MAX">Performance Max</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Orçamento diário (R$)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={form.dailyBudget}
              onChange={(e) => set('dailyBudget', parseFloat(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Estratégia de lance</Label>
            <Select value={form.biddingStrategy} onValueChange={(v) => set('biddingStrategy', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL_CPC">CPC Manual</SelectItem>
                <SelectItem value="TARGET_CPA">CPA Alvo</SelectItem>
                <SelectItem value="TARGET_ROAS">ROAS Alvo</SelectItem>
                <SelectItem value="MAXIMIZE_CONVERSIONS">Maximizar Conversões</SelectItem>
                <SelectItem value="MAXIMIZE_CONVERSION_VALUE">Maximizar Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.biddingStrategy === 'TARGET_CPA' && (
            <div className="space-y-2">
              <Label>CPA Alvo (R$)</Label>
              <Input type="number" min="0.01" step="0.01" value={form.targetCpa ?? ''} onChange={(e) => set('targetCpa', parseFloat(e.target.value))} required />
            </div>
          )}
          {form.biddingStrategy === 'TARGET_ROAS' && (
            <div className="space-y-2">
              <Label>ROAS Alvo (ex: 3.0 = 300%)</Label>
              <Input type="number" min="0.01" step="0.01" value={form.targetRoas ?? ''} onChange={(e) => set('targetRoas', parseFloat(e.target.value))} required />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : campaign ? 'Salvar' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
