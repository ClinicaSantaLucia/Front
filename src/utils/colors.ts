// src/utils/colors.ts
export const palette = [
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#22c55e",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#e11d48",
    "#06b6d4",
    "#a855f7",
    "#f43f5e",
    "#059669",
  ]
  
  export const greys = ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1f2937"]
  
  export const qualitative10 = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ab"]
  
  export function colorAt(i: number, pal: string[] = palette): string {
    if (!pal.length) return "#0ea5e9"
    return pal[((i % pal.length) + pal.length) % pal.length]
  }
  
  export function alpha(hex: string, a: number): string {
    const h = hex.replace("#", "")
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    const clamped = Math.max(0, Math.min(1, a))
    return `rgba(${r}, ${g}, ${b}, ${clamped})`
  }
  