// src/components/dashboard/ByDoctorStacked.tsx
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Props = {
  doctors: string[]
  operations: string[]
  matrix: number[][]
  className?: string
  height?: number
  horizontalThreshold?: number
  showLegend?: boolean
  colors?: string[]
}

const DEFAULT_COLORS = ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

export default function ByDoctorStacked({
  doctors,
  operations,
  matrix,
  className,
  height = 420,
  horizontalThreshold = 10,
  showLegend = true,
  colors = DEFAULT_COLORS,
}: Props) {
  const many = doctors.length > horizontalThreshold
  const rowHeight = 26
  const dynHeight = many ? Math.min(120 + doctors.length * rowHeight, 1400) : height

  const series = operations.map((op, opIdx) => ({
    name: op,
    type: "bar" as const,
    stack: "total",
    emphasis: { focus: "series" as const },
    itemStyle: { color: colors[opIdx % colors.length] },
    data: doctors.map((_, docIdx) => matrix[docIdx]?.[opIdx] ?? 0),
  }))

  return (
    <div className={clsx(className)}>
      <ReactECharts
        notMerge
        style={{ height: dynHeight }}
        option={{
          tooltip: {
            trigger: "axis",
            confine: true,
            borderWidth: 0,
            backgroundColor: "rgba(15,23,42,0.9)",
            textStyle: { color: "#fff" },
            axisPointer: { type: "shadow" },
            formatter: (params: any[]) => {
              const items = params.filter((p) => Number(p.value) > 0)
              if (!items.length) return ""
              const name = String(items[0].name || "")
              return [name, ...items.map((p) => `${p.marker} ${p.seriesName}: ${p.value}`)].join("<br/>")
            },
          },
          legend: showLegend ? { bottom: 0, type: "scroll", data: operations, textStyle: { color: "#475569" } } : undefined,
          grid: many
            ? { left: 160, right: 24, bottom: showLegend ? 48 : 24, top: 20, containLabel: true }
            : { left: "3%", right: "4%", bottom: showLegend ? "14%" : "8%", top: 20, containLabel: true },
          xAxis: many
            ? { type: "value" }
            : {
                type: "category",
                data: doctors,
                axisLabel: { interval: 0, rotate: 25, hideOverlap: true, margin: 12, color: "#334155" },
                axisLine: { lineStyle: { color: "#e2e8f0" } },
                axisTick: { show: false },
              },
          yAxis: many
            ? {
                type: "category",
                data: doctors,
                axisLabel: { interval: 0, width: 140, overflow: "truncate", ellipsis: "…", fontSize: 11, margin: 8, color: "#334155" },
                axisLine: { lineStyle: { color: "#e2e8f0" } },
              }
            : { type: "value", axisLabel: { color: "#334155" }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
          dataZoom: many
            ? [
                { type: "inside", yAxisIndex: 0, start: 0, end: 100 },
                { type: "slider", yAxisIndex: 0, start: 0, end: 100, right: 8 },
              ]
            : [
                { type: "inside", start: 0, end: 100 },
                { type: "slider", start: 0, end: 100, bottom: 38 },
              ],
          series,
        }}
      />
    </div>
  )
}
    