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

export default function GenderPie({
  data,
  loading = false,
  className,
  height = 300,
  style,
  title = "Distribución por género",
}: Props) {
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
            tooltip: { trigger: "item", confine: true, borderWidth: 0, backgroundColor: "rgba(15,23,42,0.9)", textStyle: { color: "#fff" } },
            legend: { bottom: 0, textStyle: { color: "#475569" } },
            series: [
              {
                name: "Género",
                type: "pie",
                radius: "60%",
                center: ["50%", "45%"],
                data,
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.25)" } },
              },
            ],
          }}
        />
      )}
    </div>
  )
}
