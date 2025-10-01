// src/utils/format.ts
export function currencyPEN(n: number, withSymbol = true, decimals = 2): string {
    const f = new Intl.NumberFormat("es-PE", {
      style: withSymbol ? "currency" : "decimal",
      currency: "PEN",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return f.format(isFinite(n) ? n : 0)
  }
  
  export function numberCompact(n: number): string {
    const f = new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 })
    return f.format(isFinite(n) ? n : 0)
  }
  
  export function percentText(v: number, decimals = 0): string {
    const f = new Intl.NumberFormat("es-PE", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
    return `${f.format(isFinite(v) ? v : 0)}%`
  }
  
  export function dateShort(d: Date | string | null | undefined): string {
    if (!d) return ""
    const dt = typeof d === "string" ? new Date(d) : d
    if (isNaN(dt.getTime())) return ""
    return dt.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" })
  }
  
  export function monthLabel(m: number, locale: string = "es-PE", style: "long" | "short" = "long"): string {
    const ref = new Date(2025, Math.min(11, Math.max(0, m - 1)), 1)
    return ref.toLocaleDateString(locale, { month: style })
  }
  
  export function titleCase(s: string): string {
    return (s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/(^|\s)\S/g, (t) => t.toUpperCase())
      .trim()
  }
  
  export function trimUpper(s: string): string {
    return (s || "").toUpperCase().replace(/\s+/g, " ").trim()
  }
  