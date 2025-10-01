// src/components/dashboard/MonthTotalsBar.tsx
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Props = {
  labels: string[]
  values: number[]
  className?: string
  height?: number
}

export default function MonthTotalsBar({
  labels,
  values,
  className,
  height = 300,
}: Props) {
  return (
    <div className={clsx(className)}>
      <ReactECharts
        style={{ height }}
        notMerge
        option={{
          tooltip: { trigger: "axis", confine: true, borderWidth: 0, backgroundColor: "rgba(15,23,42,0.9)", textStyle: { color: "#fff" } },
          grid: { left: 24, right: 16, top: 24, bottom: 40 },
          xAxis: { type: "category", data: labels, axisLabel: { interval: 0, rotate: 20, color: "#334155" }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisTick: { show: false } },
          yAxis: { type: "value", axisLabel: { color: "#334155" }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
          series: [
            {
              name: "Historias",
              type: "bar",
              data: values,
              itemStyle: { color: "#0ea5e9", borderRadius: [6, 6, 0, 0] },
              emphasis: { itemStyle: { color: "#0284c7" } },
            },
          ],
        }}
      />
    </div>
  )
}
