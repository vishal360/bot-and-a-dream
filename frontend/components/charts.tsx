"use client";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtUSD } from "../lib/format";

/** Lightweight SVG sparkline — no chart lib needed on cards. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const { path, area, up, min, max } = useMemo(() => {
    if (!data || data.length < 2) return { path: "", area: "", up: true, min: 0, max: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const up = data[data.length - 1] >= data[0];
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 3 - ((v - min) / span) * (height - 6);
      return [x, y] as const;
    });
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${path} L${width},${height} L0,${height} Z`;
    return { path, area, up, min, max };
  }, [data, width, height]);

  if (!path) return <div style={{ width, height }} className="bg-panel2/50 rounded" />;
  const color = up ? "#34d399" : "#fb7185";
  const gid = useMemo(() => `sg-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={width}
        cy={(() => {
          const last = data[data.length - 1];
          const span = max - min || 1;
          return height - 3 - ((last - min) / span) * (height - 6);
        })()}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-ink/95 px-3 py-2 shadow-xl">
      {label != null && <div className="label mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 font-mono text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="text-zinc-400">{p.name}</span>
          <span className="text-zinc-100 tabular">{money ? fmtUSD(p.value) : Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function EquityChart({
  equity,
  benchmark,
  height = 220,
}: {
  equity: number[];
  benchmark?: number[];
  height?: number;
}) {
  const data = useMemo(
    () =>
      equity.map((v, i) => ({
        i,
        equity: v,
        ...(benchmark ? { benchmark: benchmark[Math.min(i, benchmark.length - 1)] } : {}),
      })),
    [equity, benchmark]
  );
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1b1c20" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis
          tick={{ fill: "#63666f", fontSize: 10, fontFamily: "JetBrains Mono" }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={44}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip money />} />
        {benchmark && (
          <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke="#63666f" strokeWidth={1.2} strokeDasharray="5 4" fill="none" dot={false} />
        )}
        <Area type="monotone" dataKey="equity" name="Equity" stroke="#34d399" strokeWidth={2} fill="url(#eqFill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function UnderwaterChart({ drawdown, height = 110 }: { drawdown: number[]; height?: number }) {
  const data = useMemo(() => drawdown.map((v, i) => ({ i, dd: v })), [drawdown]);
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <YAxis
          tick={{ fill: "#63666f", fontSize: 10, fontFamily: "JetBrains Mono" }}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          width={40}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={0} stroke="#2a2c31" />
        <Area type="monotone" dataKey="dd" name="Drawdown %" stroke="#fb7185" strokeWidth={1.5} fill="url(#ddFill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
