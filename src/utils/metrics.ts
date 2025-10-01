// src/utils/metrics.ts
export function pct(part: number, total: number, decimals = 0): number {
    if (!isFinite(part) || !isFinite(total) || total <= 0) return 0
    const v = (part / total) * 100
    const f = Math.pow(10, decimals)
    return Math.round(v * f) / f
  }
  
  export function share(value: number, total: number, decimals = 0): number {
    return pct(value, total, decimals)
  }
  
  export function changePct(current: number, previous: number, decimals = 0): number {
    if (!isFinite(current) || !isFinite(previous) || previous === 0) return current > 0 ? 100 : 0
    const v = ((current - previous) / Math.abs(previous)) * 100
    const f = Math.pow(10, decimals)
    return Math.round(v * f) / f
  }
  
  export function mom(current: number, previous: number, decimals = 0): number {
    return changePct(current, previous, decimals)
  }
  
  export function yoy(current: number, previous: number, decimals = 0): number {
    return changePct(current, previous, decimals)
  }
  
  export type KV = { name: string; value: number }
  
  export function pareto(
    items: KV[],
    by: "value" | ((x: KV) => number) = "value",
    threshold = 0.8
  ): Array<KV & { cumulative: number; share: number; isCore: boolean }> {
    const getter = typeof by === "function" ? by : (x: KV) => x[by]
    const total = items.reduce((s, it) => s + Math.max(0, getter(it) || 0), 0)
    const sorted = [...items].sort((a, b) => (getter(b) || 0) - (getter(a) || 0))
    let acc = 0
    return sorted.map((it) => {
      const v = Math.max(0, getter(it) || 0)
      const s = total > 0 ? v / total : 0
      acc += s
      return { ...it, share: s, cumulative: acc, isCore: acc <= threshold }
    })
  }
  
  export function accumulateSeries(arr: number[]): number[] {
    let acc = 0
    return arr.map((v) => (acc += (isFinite(v) ? v : 0)))
  }
  
  export function rollingAverage(arr: number[], window = 3): number[] {
    if (window <= 1) return arr.map((v) => (isFinite(v) ? v : 0))
    const out: number[] = []
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
      sum += isFinite(arr[i]) ? arr[i] : 0
      if (i >= window) sum -= isFinite(arr[i - window]) ? arr[i - window] : 0
      out.push(i + 1 >= window ? sum / window : sum / (i + 1))
    }
    return out
  }
  
  export function sumByMonth<T>(
    items: T[],
    getDate: (x: T) => Date | string | null | undefined,
    getValue: (x: T) => number
  ): { months: number[]; totals: number[] } {
    const m = Array.from({ length: 12 }, () => 0)
    for (const it of items) {
      const d = getDate(it)
      if (!d) continue
      const dt = typeof d === "string" ? new Date(d) : d
      if (isNaN(dt.getTime())) continue
      const v = getValue(it)
      m[dt.getMonth()] += isFinite(v) ? v : 0
    }
    return { months: Array.from({ length: 12 }, (_, i) => i + 1), totals: m }
  }
  
  export function countByMonth<T>(
    items: T[],
    getDate: (x: T) => Date | string | null | undefined
  ): { months: number[]; totals: number[] } {
    const m = Array.from({ length: 12 }, () => 0)
    for (const it of items) {
      const d = getDate(it)
      if (!d) continue
      const dt = typeof d === "string" ? new Date(d) : d
      if (isNaN(dt.getTime())) continue
      m[dt.getMonth()] += 1
    }
    return { months: Array.from({ length: 12 }, (_, i) => i + 1), totals: m }
  }
  