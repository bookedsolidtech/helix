"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { HealthDimension } from "@/lib/health-scorer";

interface HealthRadarProps {
  dimensions: HealthDimension[];
}

export function HealthRadar({ dimensions }: HealthRadarProps) {
  const allData = dimensions.map((d) => ({
    dimension: d.name,
    verified: d.confidence === "verified" && d.measured ? (d.score ?? 0) : 0,
    heuristic: d.confidence === "heuristic" && d.measured ? (d.score ?? 0) : 0,
    score: d.measured ? (d.score ?? 0) : 0,
    confidence: d.confidence,
    measured: d.measured,
    methodology: d.methodology,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={allData}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={({ payload, x, y, textAnchor }: { payload: { value: string }; x: number; y: number; textAnchor: "start" | "middle" | "end" | "inherit" | undefined }) => {
            const dim = dimensions.find((d) => d.name === payload.value);
            const color = !dim?.measured
              ? "#475569"
              : dim.confidence === "verified"
                ? "#94a3b8"
                : dim.confidence === "heuristic"
                  ? "#92400e"
                  : "#64748b";
            return (
              <text x={x} y={y} textAnchor={textAnchor} fill={color} fontSize={10}>
                {payload.value}
              </text>
            );
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#64748b", fontSize: 10 }}
        />
        {/* Verified dimensions: solid fill */}
        <Radar
          name="Verified"
          dataKey="verified"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {/* Heuristic dimensions: dashed stroke, lighter fill */}
        <Radar
          name="Heuristic"
          dataKey="heuristic"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "0.5rem",
            color: "#f8fafc",
            fontSize: "0.75rem",
          }}
          formatter={(_value: number, name: string, entry: { payload?: { measured?: boolean; confidence?: string; methodology?: string; score?: number } }) => {
            const p = entry.payload;
            if (!p?.measured) return ["Not yet measured", name];
            const label = `${p.score}% (${p.confidence})`;
            return [label, p.methodology ?? name];
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
