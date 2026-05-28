'use client';

import { cn } from '@/lib/utils';
import type { DeliveryStatus } from '@/lib/types';
import { Package, Truck, CheckCircle, XCircle, RotateCcw, ArrowLeftRight } from 'lucide-react';

const statusConfig: Record<DeliveryStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDENTE: {
    label: 'Pendente',
    color: 'text-warning-foreground',
    bgColor: 'bg-warning/20',
    icon: Package,
  },
  COLETADO: {
    label: 'Coletado',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/20',
    icon: Package,
  },
  EM_TRANSITO: {
    label: 'Em Transito',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/20',
    icon: Truck,
  },
  ENTREGUE: {
    label: 'Entregue',
    color: 'text-success',
    bgColor: 'bg-success/20',
    icon: CheckCircle,
  },
  INSUCESSO: {
    label: 'Insucesso',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    icon: XCircle,
  },
  REENTREGA: {
    label: 'Reentrega',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/20',
    icon: RotateCcw,
  },
  DEVOLUCAO: {
    label: 'Devolucao',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: ArrowLeftRight,
  },
};

interface StatusBadgeProps {
  status: DeliveryStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </span>
  );
}
