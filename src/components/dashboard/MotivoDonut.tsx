import type { CSSProperties } from "react"
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Slice = { name: string; value: number }
type Props = {
  data: Slice[]
  loading?: boolean
  className?: string
  height?: number
  style?: CSSProperties
  title?: string
}

export default function MotivoDonut({
  data,
  loading = false,
  className,
  height = 300,
  style,
  title = "% Cirugía vs % Tratamiento",
}: Props) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      {loading ? (
        <div className="h-[300px] rounded-xl bg-slate-50" />
      ) : (
        <ReactECharts
          style={{ height }}
          notMerge
          option={{
            tooltip: {
              trigger: "item",
              confine: true,
              borderWidth: 0,
              backgroundColor: "rgba(15,23,42,0.9)",
              textStyle: { color: "#fff" },
              formatter: (p: any) => {
                const v = Number(p.value ?? 0)
                const pct = total > 0 ? Math.round((v * 100) / total) : 0
                return `${p.name}<br/>${v} · ${pct}%`
              },
            },
            legend: { bottom: 0, textStyle: { color: "#475569" } },
            series: [
              {
                name: "Motivo",
                type: "pie",
                radius: ["50%", "70%"],
                center: ["50%", "45%"],
                data,
                label: {
                  formatter: (p: any) => {
                    const v = Number(p.value ?? 0)
                    const pct = total > 0 ? Math.round((v * 100) / total) : 0
                    return `${pct}%`
                  },
                },
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.25)" } },
              },
            ],
          }}
        />
      )}
    </div>
  )
}
