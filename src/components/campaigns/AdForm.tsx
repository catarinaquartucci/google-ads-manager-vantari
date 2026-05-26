import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { AdGroup } from '@/types'

export interface AdFormData {
  adGroupId: string
  finalUrl: string
  headlines: Array<{ text: string }>
  descriptions: Array<{ text: string }>
  path1: string
  path2: string
}

interface AdFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adGroups: AdGroup[]
  onSubmit: (data: AdFormData) => void
  isLoading?: boolean
}

export function AdForm({ open, onOpenChange, adGroups, onSubmit, isLoading }: AdFormProps) {
  const [form, setForm] = useState<AdFormData>({
    adGroupId: adGroups[0]?.id ?? '',
    finalUrl: '',
    headlines: [{ text: '' }, { text: '' }, { text: '' }],
    descriptions: [{ text: '' }, { text: '' }],
    path1: '',
    path2: '',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Anuncio (RSA)</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
          <div className="space-y-2">
            <Label>Grupo de anuncios</Label>
            <Select value={form.adGroupId} onValueChange={v => setForm(p => ({ ...p, adGroupId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar grupo" /></SelectTrigger>
              <SelectContent>
                {adGroups.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.campaignName} - {ag.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL final</Label>
            <Input type="url" value={form.finalUrl} onChange={e => setForm(p => ({ ...p, finalUrl: e.target.value }))} required placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Caminho 1</Label>
              <Input value={form.path1} onChange={e => setForm(p => ({ ...p, path1: e.target.value }))} maxLength={15} placeholder="produtos" />
            </div>
            <div className="space-y-2">
              <Label>Caminho 2</Label>
              <Input value={form.path2} onChange={e => setForm(p => ({ ...p, path2: e.target.value }))} maxLength={15} placeholder="oferta" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Titulos ({form.headlines.length}/15)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => { if (form.headlines.length < 15) setForm(p => ({ ...p, headlines: [...p.headlines, { text: '' }] })) }}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            {form.headlines.map((h, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={h.text} onChange={e => { const t = e.target.value; setForm(p => ({ ...p, headlines: p.headlines.map((x, idx) => idx === i ? { text: t } : x) })) }} maxLength={30} placeholder={`Titulo ${i + 1} (max 30 chars)`} required={i < 3} />
                <span className="text-xs text-gray-400 w-8">{h.text.length}/30</span>
                {i >= 3 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm(p => ({ ...p, headlines: p.headlines.filter((_, idx) => idx !== i) }))}><Trash2 className="h-3 w-3" /></Button>}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Descricoes ({form.descriptions.length}/4)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => { if (form.descriptions.length < 4) setForm(p => ({ ...p, descriptions: [...p.descriptions, { text: '' }] })) }}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            {form.descriptions.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={d.text} onChange={e => { const t = e.target.value; setForm(p => ({ ...p, descriptions: p.descriptions.map((x, idx) => idx === i ? { text: t } : x) })) }} maxLength={90} placeholder={`Descricao ${i + 1} (max 90 chars)`} required={i < 2} />
                <span className="text-xs text-gray-400 w-8">{d.text.length}/90</span>
                {i >= 2 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm(p => ({ ...p, descriptions: p.descriptions.filter((_, idx) => idx !== i) }))}><Trash2 className="h-3 w-3" /></Button>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Anuncio'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
