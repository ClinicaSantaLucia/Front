// src/components/dashboard/KPISparkline.tsx
import ReactECharts from "echarts-for-react"
import clsx from "clsx"

type Props = {
  data: number[]
  className?: string
}

export default function KPISparkline({ data, className }: Props) {
  return (
    <div className={clsx(className)}>
      <ReactECharts
        style={{ height: 56 }}
        notMerge
        option={{
          grid: { left: 0, right: 0, top: 8, bottom: 0 },
          xAxis: { type: "category", show: false, data: data.map((_, i) => i + 1) },
          yAxis: { type: "value", show: false },
          tooltip: { trigger: "axis" },
          series: [
            {
              type: "line",
              data,
              smooth: true,
              symbol: "none",
              lineStyle: { width: 2, color: "#0ea5e9" },
              areaStyle: { opacity: 0.08, color: "#0ea5e9" },
            },
          ],
        }}
      />
    </div>
  )
}
