"use client";

import * as React from "react";

// ---------- Sparkline ----------
export function Sparkline({
  data,
  width = 100,
  height = 32,
  color,
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;
  const X = (i: number) => (i / (n - 1)) * width;
  const Y = (v: number) => height - 2 - ((v - min) / range) * (height - 4);
  let d = `M${X(0)},${Y(data[0])}`;
  for (let i = 1; i < n; i++) d += ` L${X(i)},${Y(data[i])}`;
  const area = d + ` L${X(n - 1)},${height} L${X(0)},${height} Z`;
  const trend = data[n - 1] - data[0];
  const stroke = color || (trend <= 0 ? "#10b981" : "#ef4444");
  const gradId = `sp-${Math.abs(Math.floor(trend * 1000))}-${n}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="spark"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
        </>
      )}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------- BarChart ----------
export function BarChart({
  data,
  width = 620,
  height = 180,
  color = "#3b82f6",
  xLabels,
  yFormat = (v) => String(v),
  highlightLast = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  xLabels?: string[];
  yFormat?: (v: number) => string | number;
  highlightLast?: boolean;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const px = 36;
  const py = 16;
  const w = width - px - 20;
  const h = height - py * 2 - 10;
  const n = data.length;
  const bw = (w / n) * 0.55;
  const steps = 3;
  const grid = [];
  for (let i = 0; i <= steps; i++) {
    const v = max * (i / steps);
    grid.push({ y: py + (1 - i / steps) * h, label: yFormat(v) });
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto overflow-visible"
    >
      <defs>
        <linearGradient id="cf-grad-bar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="cf-grad-bar-hi" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {grid.map((g, i) => (
        <g key={i}>
          <line
            x1={px}
            x2={px + w}
            y1={g.y}
            y2={g.y}
            stroke="#e2e8f0"
            strokeDasharray="3 4"
          />
          <text
            x={px - 8}
            y={g.y + 4}
            fontSize="10"
            fill="#94a3b8"
            textAnchor="end"
            fontFamily="JetBrains Mono"
          >
            {g.label}
          </text>
        </g>
      ))}
      {data.map((v, i) => {
        const cx = px + (i + 0.5) * (w / n);
        const bh = (v / max) * h;
        const y = py + h - bh;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={cx - bw / 2}
            y={y}
            width={bw}
            height={Math.max(bh, v === 0 ? 0 : 2)}
            rx="4"
            fill={
              highlightLast && isLast
                ? "url(#cf-grad-bar-hi)"
                : "url(#cf-grad-bar)"
            }
            opacity={v === 0 ? 0.15 : 1}
          />
        );
      })}
      {xLabels &&
        xLabels.map((l, i) => (
          <text
            key={i}
            x={px + ((i * (n - 1)) / (xLabels.length - 1) + 0.5) * (w / n)}
            y={height - 2}
            fontSize="10"
            fill="#94a3b8"
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
    </svg>
  );
}

// ---------- Donut ----------
export function Donut({
  segments,
  size = 140,
  stroke = 14,
  center,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * C;
          const off = C - acc;
          acc += dash;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={off}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {center}
        </div>
      )}
    </div>
  );
}
