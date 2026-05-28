'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { canAccessPath, roleLabels, useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Truck,
  Users,
  MessageSquare,
  CreditCard,
  FileText,
  Handshake,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Entregas', href: '/entregas', icon: Package },
  { name: 'Rastreamento', href: '/rastreamento', icon: MapPin },
  { name: 'Frota', href: '/frota', icon: Truck },
  { name: 'Motoristas', href: '/motoristas', icon: Users },
  { name: 'Mensagens', href: '/mensagens', icon: MessageSquare },
  { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard },
  { name: 'Cotacoes', href: '/cotacoes', icon: FileText },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Propostas', href: '/propostas', icon: Handshake },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const visibleNavigation = user
    ? navigation.filter((item) => canAccessPath(user.role, item.href))
    : navigation;

  async function handleLogout() {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Truck className="h-4 w-4 text-primary-foreground" />
        </div> */}
        <div>
          <span className="block text-lg font-semibold leading-tight text-sidebar-foreground">North Seven System</span>
          {user && (
            <span className="text-xs text-sidebar-foreground/50">{roleLabels[user.role]}</span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
