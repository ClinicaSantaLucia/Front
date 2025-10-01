import type { CSSProperties } from "react"
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Row = { name: string; value: number }
type Props = {
  data: Row[]
  loading?: boolean
  className?: string
  height?: number
  style?: CSSProperties
  title?: string
}

export default function SpecialtyShareBar({
  data,
  loading = false,
  className,
  height = 320,
  style,
  title = "Participación por especialidad",
}: Props) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  const labels = data.map((d) => d.name)
  const values = data.map((d) => d.value)
  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      {loading ? (
        <div className="h-[320px] rounded-xl bg-slate-50" />
      ) : (
        <ReactECharts
          style={{ height }}
          notMerge
          option={{
            tooltip: {
              trigger: "axis",
              confine: true,
              borderWidth: 0,
              backgroundColor: "rgba(15,23,42,0.9)",
              textStyle: { color: "#fff" },
              axisPointer: { type: "shadow" },
              formatter: (params: any[]) => {
                const p = params?.[0]
                const v = Number(p?.value ?? 0)
                const pct = total > 0 ? Math.round((v * 100) / total) : 0
                return `${p?.name}<br/>${v} · ${pct}%`
              },
            },
            grid: { left: 220, right: 24, top: 20, bottom: 24, containLabel: true },
            xAxis: { type: "value", splitLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#334155" } },
            yAxis: {
              type: "category",
              data: labels,
              axisLabel: { interval: 0, width: 200, overflow: "truncate", ellipsis: "…", fontSize: 11, margin: 8, color: "#334155" },
            },
            series: [
              {
                name: "Participación",
                type: "bar",
                data: values,
                label: {
                  show: true,
                  position: "right",
                  color: "#334155",
                  fontSize: 11,
                  formatter: (p: any) => {
                    const v = Number(p.value ?? 0)
                    const pct = total > 0 ? Math.round((v * 100) / total) : 0
                    return `${v} · ${pct}%`
                  },
                },
                itemStyle: { color: (p: any) => ["#0ea5e9", "#10b981", "#94a3b8", "#64748b", "#475569", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"][p.dataIndex % 9] },
                barCategoryGap: "30%",
              },
            ],
          }}
        />
      )}
    </div>
  )
}
