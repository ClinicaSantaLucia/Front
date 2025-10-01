import { useCallback, useEffect, useMemo, useState } from "react"
import { databases, Query } from "../lib/appwrite"

type Options = {
  source?: "appwrite"
  databaseId?: string
  collectionId?: string
  dateField?: string
  initial?: number[]
}

export function useYearOptions(opts: Options = {}) {
  const {
    source = "appwrite",
    databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID,
    collectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID,
    dateField = "admission_date",
    initial = [],
  } = opts

  const [years, setYears] = useState<number[]>(initial)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const parseYear = (v: unknown): number | null => {
    const s = (v ?? "").toString()
    if (!s) return null
    const d = new Date(s)
    if (isNaN(d.getTime())) return null
    return d.getFullYear()
  }

  const fetchYears = useCallback(async () => {
    if (source !== "appwrite") return
    setLoading(true)
    setError(null)
    try {
      const set = new Set<number>()
      let page = 0
      const limit = 100
      let more = true
      while (more) {
        const res = await databases.listDocuments(databaseId, collectionId, [
          Query.limit(limit),
          Query.offset(page * limit),
          Query.select([dateField]),
        ])
        for (const doc of res.documents as Record<string, unknown>[]) {
          const y = parseYear(doc[dateField])
          if (y !== null) set.add(y)
        }
        more = res.documents.length === limit
        page++
      }
      const arr = Array.from(set).sort((a, b) => b - a)
      setYears(arr)
    } catch (e: any) {
      setError(e?.message || "Error al cargar años")
    } finally {
      setLoading(false)
    }
  }, [source, databaseId, collectionId, dateField])

  useEffect(() => {
    fetchYears()
  }, [fetchYears])

  const min = useMemo(() => (years.length ? Math.min(...years) : null), [years])
  const max = useMemo(() => (years.length ? Math.max(...years) : null), [years])

  return { years, loading, error, min, max, refresh: fetchYears }
}

export default useYearOptions
