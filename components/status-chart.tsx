'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusDistributionPoint } from '@/lib/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export function StatusChart({ data }: { data: StatusDistributionPoint[] }) {
  const total = data.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Status das Entregas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="quantidade"
                nameKey="status"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground">
                {item.status}
              </span>
              <span className="ml-auto text-sm font-medium">
                {total ? Math.round((item.quantidade / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
        {data.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Sem entregas para exibir.</p>}
      </CardContent>
    </Card>
  );
}
