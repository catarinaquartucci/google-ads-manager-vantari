import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CampaignTable } from '@/components/dashboard/CampaignTable'
import { CampaignForm, type CampaignFormData } from '@/components/campaigns/CampaignForm'
import { useCampaigns, usePauseCampaign, useEnableCampaign, useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns'
import { useToast } from '@/components/ui/use-toast'
import type { Campaign, DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

export function CampaignsPage() {
  const { dateRange, customerId } = useOutletContext<OutletCtx>()
  const { data: campaigns = [], isLoading } = useCampaigns(customerId, dateRange.gaqlRange)
  const { mutate: pause } = usePauseCampaign(customerId)
  const { mutate: enable } = useEnableCampaign(customerId)
  const { mutateAsync: create, isPending: creating } = useCreateCampaign(customerId)
  const { mutateAsync: update, isPending: updating } = useUpdateCampaign(customerId)
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState<Campaign | undefined>()

  const handleSubmit = async (data: CampaignFormData) => {
    try {
      if (editCampaign) {
        await update({ campaignId: editCampaign.id, name: data.name, status: data.status, dailyBudget: data.dailyBudget, budgetId: editCampaign.budgetId })
        toast({ title: 'Campanha atualizada' })
      } else {
        await create(data)
        toast({ title: 'Campanha criada' })
      }
      setFormOpen(false)
      setEditCampaign(undefined)
    } catch (err) {
      toast({ title: 'Erro', description: String(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Campanhas ({campaigns.length})</h2>
        <Button onClick={() => { setEditCampaign(undefined); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>
      <Card>
        <CampaignTable
          campaigns={campaigns}
          isLoading={isLoading}
          onPause={id => pause(id, { onSuccess: () => toast({ title: 'Pausada' }) })}
          onEnable={id => enable(id, { onSuccess: () => toast({ title: 'Ativada' }) })}
          onEdit={c => { setEditCampaign(c); setFormOpen(true) }}
        />
      </Card>
      <CampaignForm
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editCampaign}
        onSubmit={handleSubmit}
        isLoading={creating || updating}
      />
    </div>
  )
}
