import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, Layers, FileText, BarChart2, Brain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/ad-groups', icon: Layers, label: 'Grupos de Anúncios' },
  { to: '/ads', icon: FileText, label: 'Anúncios' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/ai', icon: Brain, label: 'IA Assistant' },
  { to: '/rules', icon: Zap, label: 'Regras Automáticas' },
]

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Google Ads</p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v1.0.0</p>
      </div>
    </aside>
  )
}
