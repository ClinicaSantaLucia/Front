import type { CSSProperties } from "react"
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type YearPoint = { year: number; count: number }
type Props = {
  data: YearPoint[]
  loading?: boolean
  className?: string
  height?: number
  style?: CSSProperties
  onSelectYear?: (year: number) => void
}

export default function YearTotalsBar({
  data,
  loading = false,
  className,
  height = 300,
  style,
  onSelectYear,
}: Props) {
  const years = data.map((d) => d.year)
  const counts = data.map((d) => d.count)

  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      {loading ? (
        <div className="h-[300px] rounded-xl bg-slate-50" />
      ) : (
        <ReactECharts
          style={{ height }}
          notMerge
          option={{
            tooltip: { trigger: "axis", confine: true, borderWidth: 0, backgroundColor: "rgba(15,23,42,0.9)", textStyle: { color: "#fff" } },
            grid: { left: 24, right: 16, top: 24, bottom: 28 },
            xAxis: { type: "category", data: years, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisTick: { show: false }, axisLabel: { color: "#475569" } },
            yAxis: { type: "value", splitLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#475569" } },
            series: [
              {
                name: "Historias",
                type: "bar",
                data: counts,
                itemStyle: { color: "#475569", borderRadius: [6, 6, 0, 0] },
                emphasis: { itemStyle: { color: "#1e293b" } },
              },
            ],
          }}
          onEvents={{
            click: (e: any) => {
              if (!onSelectYear) return
              const idx = e?.dataIndex
              if (typeof idx === "number" && years[idx] !== undefined) onSelectYear(years[idx])
            },
          }}
        />
      )}
    </div>
  )
}
