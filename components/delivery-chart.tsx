'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliveryTrendPoint } from '@/lib/dashboard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function DeliveryChart({ data }: { data: DeliveryTrendPoint[] }) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Entregas por Hora</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInsucesso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="hora"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Area
                type="monotone"
                dataKey="entregas"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#colorEntregas)"
                name="Entregas"
              />
              <Area
                type="monotone"
                dataKey="insucesso"
                stroke="var(--chart-4)"
                strokeWidth={2}
                fill="url(#colorInsucesso)"
                name="Insucesso"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-1" />
            <span className="text-sm text-muted-foreground">Entregas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-4" />
            <span className="text-sm text-muted-foreground">Insucesso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
