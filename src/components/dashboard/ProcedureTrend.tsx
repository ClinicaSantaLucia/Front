// src/components/dashboard/ProcedureTrend.tsx
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Props = {
  months: string[]
  values: number[]
  className?: string
  height?: number
}

export default function ProcedureTrend({ months, values, className, height = 320 }: Props) {
  return (
    <div className={clsx(className)}>
      <ReactECharts
        notMerge
        style={{ height }}
        option={{
          tooltip: {
            trigger: "axis",
            confine: true,
            axisPointer: { type: "line" },
            borderWidth: 0,
            backgroundColor: "rgba(15,23,42,0.9)",
            textStyle: { color: "#fff" },
          },
          grid: { left: 24, right: 16, top: 16, bottom: 36, containLabel: true },
          xAxis: {
            type: "category",
            data: months,
            axisLabel: { color: "#334155", rotate: 15 },
            axisLine: { lineStyle: { color: "#e2e8f0" } },
            axisTick: { show: false },
          },
          yAxis: {
            type: "value",
            axisLabel: { color: "#334155" },
            splitLine: { lineStyle: { color: "#e2e8f0" } },
          },
          series: [
            {
              type: "line",
              data: values,
              smooth: true,
              symbol: "circle",
              symbolSize: 5,
              lineStyle: { width: 2, color: "#0ea5e9" },
              itemStyle: { color: "#0ea5e9" },
              areaStyle: { opacity: 0.06, color: "#0ea5e9" },
            },
          ],
          dataZoom: [{ type: "inside", start: 0, end: 100 }],
        }}
      />
    </div>
  )
}
