// src/components/dashboard/ProceduresPareto.tsx
import type { CSSProperties } from "react"
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Item = { name: string; value: number }
type Props = {
  data: Item[]
  loading?: boolean
  className?: string
  height?: number
  style?: CSSProperties
  title?: string
  topN?: number
}

export default function ProceduresPareto({
  data,
  loading = false,
  className,
  height = 480,
  style,
  title = "Pareto de procedimientos",
  topN,
}: Props) {
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0))
  const trimmed = typeof topN === "number" && topN > 0 ? sorted.slice(0, topN) : sorted
  const labels = trimmed.map((d) => d.name)
  const values = trimmed.map((d) => d.value)
  const total = values.reduce((a, b) => a + b, 0)
  let acc = 0
  const cumulative = values.map((v) => {
    acc += v
    return total > 0 ? +(Math.round(((acc / total) * 100) * 10) / 10).toFixed(1) : 0
  })

  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      {loading ? (
        <div className="rounded-xl bg-slate-50" style={{ height }} />
      ) : trimmed.length === 0 ? (
        <div className="rounded-xl bg-slate-50 grid place-items-center text-slate-500 text-sm" style={{ height }}>
          Sin datos
        </div>
      ) : (
        <ReactECharts
          style={{ height }}
          notMerge
          option={{
            legend: {
              top: 0,
              right: 8,
              itemWidth: 10,
              itemHeight: 10,
              textStyle: { color: "#475569" },
              data: ["Cantidad", "Acumulado %"],
            },
            tooltip: {
              trigger: "axis",
              confine: true,
              axisPointer: { type: "shadow" },
              borderWidth: 0,
              backgroundColor: "rgba(15,23,42,0.9)",
              textStyle: { color: "#fff" },
              formatter: (params: any[]) => {
                const bar = params.find((p) => p.seriesType === "bar")
                const line = params.find((p) => p.seriesType === "line")
                return `${bar?.name}<br/>${bar?.value} · ${line?.value}% acumulado`
              },
            },
            grid: { left: 40, right: 104, top: 40, bottom: 70, containLabel: true },
            xAxis: {
              type: "category",
              data: labels,
              boundaryGap: true,
              axisLabel: { interval: 0, rotate: 22, margin: 14, color: "#334155" },
              axisLine: { lineStyle: { color: "#e2e8f0" } },
              axisTick: { show: false },
            },
            yAxis: [
              {
                type: "value",
                axisLabel: { color: "#334155" },
                splitLine: { lineStyle: { color: "#e2e8f0" } },
              },
              {
                type: "value",
                min: 0,
                max: 100,
                axisLabel: { color: "#334155", formatter: "{value}%" },
              },
            ],
            series: [
              {
                name: "Cantidad",
                type: "bar",
                data: values,
                itemStyle: { color: "#94a3b8", borderRadius: [6, 6, 0, 0] },
                emphasis: { itemStyle: { color: "#64748b" } },
              },
              {
                name: "Acumulado %",
                type: "line",
                yAxisIndex: 1,
                data: cumulative,
                smooth: true,
                symbol: "circle",
                symbolSize: 6,
                lineStyle: { width: 2, color: "#0ea5e9" },
                itemStyle: { color: "#0ea5e9" },
              },
            ],
            dataZoom: [
              { type: "inside", start: 0, end: 100 },
              { type: "slider", start: 0, end: 100, bottom: 18 },
            ],
          }}
        />
      )}
    </div>
  )
}
