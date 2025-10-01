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
  showPercent?: boolean
}

export default function TopProceduresBar({
  data,
  loading = false,
  className,
  height = 420,
  style,
  title = "Pacientes por tipo de operación",
  showPercent = true,
}: Props) {
  const labels = data.map((d) => d.name)
  const values = data.map((d) => d.value)
  const total = values.reduce((a, b) => a + b, 0)

  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      {loading ? (
        <div className="h-[420px] rounded-xl bg-slate-50" />
      ) : data.length === 0 ? (
        <div className="h-[420px] rounded-xl bg-slate-50 grid place-items-center text-slate-500 text-sm">Sin operaciones en el período</div>
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
              formatter: (params: any) => {
                const p = Array.isArray(params) ? params[0] : params
                const v = Number(p?.value ?? 0)
                const pct = total > 0 ? Math.round((v * 100) / total) : 0
                return showPercent ? `${p.name}<br/>${v} · ${pct}%` : `${p.name}<br/>${v}`
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
                name: "Pacientes",
                type: "bar",
                data: values,
                label: {
                  show: true,
                  position: "right",
                  color: "#334155",
                  fontSize: 11,
                  formatter: (p: any) => {
                    if (!showPercent) return p.value
                    const pct = total > 0 ? Math.round((Number(p.value) * 100) / total) : 0
                    return `${p.value} · ${pct}%`
                  },
                },
                itemStyle: { color: (p: any) => ["#94a3b8", "#64748b", "#475569", "#334155", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"][p.dataIndex % 10] },
                barCategoryGap: "30%",
              },
            ],
          }}
        />
      )}
    </div>
  )
}
