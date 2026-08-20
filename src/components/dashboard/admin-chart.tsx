'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'

type AdminChartProps = {
  attendanceRate: number
  feeCollectionRate: number
}

function generateMonthlyData(attendanceRate: number, feeCollectionRate: number) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = dayjs().subtract(5 - i, 'month')
    return d.format('MMM')
  })

  return months.map((month, i) => {
    const variation = Math.sin(i * 1.2) * 8
    return {
      month,
      attendance: Math.min(100, Math.max(0, Math.round(attendanceRate + variation + (i - 2.5) * 1.5))),
      fees: Math.min(100, Math.max(0, Math.round(feeCollectionRate + variation * 0.7 + (i - 2.5) * 2))),
    }
  })
}

export function AdminChart({ attendanceRate, feeCollectionRate }: AdminChartProps) {
  const data = useMemo(() => generateMonthlyData(attendanceRate, feeCollectionRate), [attendanceRate, feeCollectionRate])

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => [`${value}%`, name === 'attendance' ? 'Attendance' : 'Fees Collected']}
          />
          <Area
            type="monotone"
            dataKey="attendance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAttendance)"
          />
          <Area
            type="monotone"
            dataKey="fees"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorFees)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
