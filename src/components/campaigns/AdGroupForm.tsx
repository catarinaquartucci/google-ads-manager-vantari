import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { AdGroup, Campaign } from '@/types'

export interface AdGroupFormData {
  name: string
  campaignId: string
  status: AdGroup['status']
  cpcBid: number
}

interface AdGroupFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adGroup?: AdGroup
  campaigns: Campaign[]
  onSubmit: (data: AdGroupFormData) => void
  isLoading?: boolean
}

export function AdGroupForm({ open, onOpenChange, adGroup, campaigns, onSubmit, isLoading }: AdGroupFormProps) {
  const [form, setForm] = useState<AdGroupFormData>({
    name: adGroup?.name ?? '',
    campaignId: adGroup?.campaignId ?? campaigns[0]?.id ?? '',
    status: adGroup?.status ?? 'ENABLED',
    cpcBid: adGroup?.cpcBid ?? 1.5,
  })
  const set = (key: keyof AdGroupFormData, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{adGroup ? 'Editar Grupo' : 'Novo Grupo de Anuncios'}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Campanha</Label>
            <Select value={form.campaignId} onValueChange={v => set('campaignId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENABLED">Ativo</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CPC Padrao (R$)</Label>
              <Input type="number" min="0.01" step="0.01" value={form.cpcBid} onChange={e => set('cpcBid', parseFloat(e.target.value))} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : adGroup ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
