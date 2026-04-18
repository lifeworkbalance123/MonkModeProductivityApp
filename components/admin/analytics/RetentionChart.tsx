'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Point = { label: string; rate7: number; rate30: number; rate60: number }

export function RetentionChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            labelStyle={{ fontSize: 12 }}
          />
          <Legend />
          <Line type="monotone" dataKey="rate7" name="Day 7" stroke="hsl(var(--accent))" dot={false} />
          <Line type="monotone" dataKey="rate30" name="Day 30" stroke="#8B5CF6" dot={false} />
          <Line type="monotone" dataKey="rate60" name="Day 60" stroke="#10B981" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
