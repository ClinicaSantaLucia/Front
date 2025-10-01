import type { CSSProperties } from "react"
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Props = {
  months: string[]
  values: number[]
  loading?: boolean
  className?: string
  style?: CSSProperties
  height?: number
  currency?: string
  showLine?: boolean
}

export default function RevenueSeries({
  months,
  values,
  loading = false,
  className,
  style,
  height = 320,
  currency = "S/",
  showLine = true,
}: Props) {
  const formatter = (v: number) => `${currency} ${v.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
  const movingAvg = (() => {
    const out: number[] = []
    for (let i = 0; i < values.length; i++) {
      const a = values[i - 2] ?? values[i]
      const b = values[i - 1] ?? values[i]
      const c = values[i]
      out.push(Math.round((a + b + c) / 3))
    }
    return out
  })()

  return (
    <div className={clsx("bg-white rounded-2xl border border-slate-200 p-4", className)} style={style}>
      {loading ? (
        <div className="h-[320px] rounded-xl bg-slate-50" />
      ) : (
        <ReactECharts
          notMerge
          style={{ height }}
          option={{
            tooltip: {
              trigger: "axis",
              confine: true,
              borderWidth: 0,
              backgroundColor: "rgba(15,23,42,0.9)",
              textStyle: { color: "#fff" },
              valueFormatter: (v: any) => formatter(Number(v || 0)),
            },
            grid: { left: 24, right: 16, top: 20, bottom: 36, containLabel: true },
            xAxis: { type: "category", data: months, axisLabel: { color: "#334155", rotate: 15 }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisTick: { show: false } },
            yAxis: { type: "value", axisLabel: { color: "#334155", formatter: (val: any) => `${currency} ${Number(val).toLocaleString("es-PE", { maximumFractionDigits: 0 })}` }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
            series: [
              { name: "Ingresos", type: "bar", data: values, itemStyle: { color: "#0ea5e9", borderRadius: [6, 6, 0, 0] }, emphasis: { itemStyle: { color: "#0284c7" } } },
              ...(showLine
                ? [
                    {
                      name: "Media móvil (3)",
                      type: "line",
                      data: movingAvg,
                      smooth: true,
                      symbol: "circle",
                      symbolSize: 5,
                      lineStyle: { width: 2, color: "#22c55e" },
                      itemStyle: { color: "#22c55e" },
                    },
                  ]
                : []),
            ],
            dataZoom: [{ type: "inside", start: 0, end: 100 }],
          }}
        />
      )}
    </div>
  )
}
