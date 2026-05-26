import { LogOut, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPresetDateRanges } from '@/lib/utils'
import type { DateRange } from '@/types'

interface HeaderProps {
  title: string
  customerId: string | null
  onSignOut: () => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function Header({ title, customerId, onSignOut, dateRange, onDateRangeChange }: HeaderProps) {
  const presets = getPresetDateRanges()

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 gap-4">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        {customerId && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
            ID: {customerId}
          </span>
        )}

        <Select
          value={dateRange.gaqlRange}
          onValueChange={(v) => {
            const p = presets.find((p) => p.gaqlRange === v)
            if (p) onDateRangeChange(p)
          }}
        >
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue>{dateRange.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.gaqlRange} value={p.gaqlRange}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <span className="text-xs text-gray-500">{customerId ?? 'Sem conta'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
