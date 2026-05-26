import { useOutletContext } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { CopyGenerator } from '@/components/ai/CopyGenerator'
import { ScaleCalculator } from '@/components/ai/ScaleCalculator'
import { CreativeFatigue } from '@/components/ai/CreativeFatigue'
import { useCampaigns } from '@/hooks/useCampaigns'
import type { DateRange } from '@/types'

interface OutletCtx { dateRange: DateRange; customerId: string | null }

export function AIPage() {
  const { dateRange, customerId } = useOutletContext<OutletCtx>()
  const { data: campaigns = [] } = useCampaigns(customerId, dateRange.gaqlRange)
  return (
    <div>
      <Tabs defaultValue="assistant">
        <TabsList className="mb-4">
          <TabsTrigger value="assistant">Assistente IA</TabsTrigger>
          <TabsTrigger value="copy">Gerador de Copy</TabsTrigger>
          <TabsTrigger value="scale">Calculadora de Escala</TabsTrigger>
          <TabsTrigger value="fatigue">Fadiga Criativa</TabsTrigger>
        </TabsList>
        <TabsContent value="assistant">
          <AIAssistant campaigns={campaigns} customerId={customerId} />
        </TabsContent>
        <TabsContent value="copy">
          <CopyGenerator />
        </TabsContent>
        <TabsContent value="scale">
          <ScaleCalculator campaigns={campaigns} />
        </TabsContent>
        <TabsContent value="fatigue">
          <CreativeFatigue campaigns={campaigns} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
