'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DashboardOccurrence } from '@/lib/dashboard';

const gravityColors: Record<DashboardOccurrence['gravidade'], string> = {
  BAIXA: 'bg-muted text-muted-foreground',
  MEDIA: 'bg-warning/20 text-warning-foreground',
  ALTA: 'bg-chart-4/20 text-chart-4',
  CRITICA: 'bg-destructive/20 text-destructive',
};

export function AlertsPanel({ occurrences }: { occurrences: DashboardOccurrence[] }) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas e Ocorrencias
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver todas
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {occurrences.map((occurrence) => (
          <div key={occurrence.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50">
            <div className={cn('mt-0.5 rounded-full p-1.5', occurrence.gravidade === 'CRITICA' || occurrence.gravidade === 'ALTA' ? 'bg-destructive/20' : 'bg-warning/20')}>
              <AlertTriangle className={cn('h-4 w-4', occurrence.gravidade === 'CRITICA' || occurrence.gravidade === 'ALTA' ? 'text-destructive' : 'text-warning')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', gravityColors[occurrence.gravidade])}>
                  {occurrence.tipo}
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs', occurrence.status === 'ABERTA' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning-foreground')}>
                  {occurrence.status}
                </span>
              </div>
              <p className="text-sm truncate">{occurrence.descricao}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(occurrence.created_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
            </div>
          </div>
        ))}

        {occurrences.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-success/20 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma ocorrencia no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
