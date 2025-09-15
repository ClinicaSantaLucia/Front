import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { databases, Query } from "../lib/appwrite"
import type { Models } from "appwrite"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const userProfileCollection =
  import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID ||
  import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID

export type DoctorProfileDoc = Models.Document & {
  full_name?: string
  specialty?: string
  role?: string
  is_active?: boolean
}

export type DoctorLookupItem = {
  id: string
  doctor_first: string
  doctor_last: string
  especialidad: string
}

export type UseDoctorLookupOptions = {
  minLength?: number
  debounceMs?: number
  limit?: number
  includeInactive?: boolean
}

function norm(v?: string | null) { return (v ?? "").toString().trim() }
function titleCase(v?: string | null) {
  const s = norm(v).toLowerCase().replace(/\s+/g, " ")
  return s.replace(/(^|\s)\S/g, (t) => t.toUpperCase())
}
function splitFullName(fullName = ""): { first: string; last: string } {
  const t = norm(fullName).split(/\s+/)
  if (t.length <= 1) return { first: "", last: titleCase(t[0] || "") }
  if (t.length === 2) return { first: titleCase(t[0]), last: titleCase(t[1]) }
  return { first: titleCase(t.slice(0, -2).join(" ")), last: titleCase(t.slice(-2).join(" ")) }
}
function mapDoc(d: DoctorProfileDoc): DoctorLookupItem {
  const { first, last } = splitFullName(d.full_name || "")
  return {
    id: d.$id,
    doctor_last: last,
    doctor_first: first,
    especialidad: titleCase(d.specialty),
  }
}
function isFulltextIndexError(err: unknown) {
  const msg = String((err as any)?.message ?? "")
  return /fulltext index/i.test(msg)
}

/** Fallback: trae ~100 doctores y filtra por full_name en cliente */
async function fallbackFilterByFullName(term: string, limit = 10): Promise<DoctorLookupItem[]> {
  const res = await databases.listDocuments<DoctorProfileDoc>(
    databaseId,
    userProfileCollection,
    [Query.equal("role", "doctor"), Query.limit(100)]
  )
  const t = norm(term).toLowerCase()
  const docs = (res.documents || []).filter((d) => (d.is_active !== false) && norm(d.full_name).toLowerCase().includes(t))
  return docs.slice(0, limit).map(mapDoc)
}

export function useDoctorLookup(options: UseDoctorLookupOptions = {}) {
  const { minLength = 2, debounceMs = 250, limit = 10, includeInactive = false } = options

  const [term, setTerm] = useState("")
  const [results, setResults] = useState<DoctorLookupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSearch = useMemo(() => norm(term).length >= minLength, [term, minLength])
  const debounceRef = useRef<number | null>(null)
  const activeReq = useRef(0)

  const fetchDoctors = useCallback(async (q: string) => {
    const cleaned = norm(q)
    if (!cleaned || cleaned.length < minLength) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const reqId = ++activeReq.current

    try {
      const queries = [
        // REQUIERE índice full-text en `full_name`
        Query.search("full_name", cleaned),
        Query.equal("role", "doctor"),
        // Ojo: NO usamos orderAsc("full_name") para no requerir índice "key"
        Query.limit(limit),
      ]
      const res = await databases.listDocuments<DoctorProfileDoc>(databaseId, userProfileCollection, queries)
      if (reqId !== activeReq.current) return
      const docs = includeInactive ? res.documents : res.documents.filter((d) => d.is_active !== false)
      setResults(docs.map(mapDoc))
    } catch (err) {
      if (reqId !== activeReq.current) return
      // Fallback si falta el índice full-text
      if (isFulltextIndexError(err)) {
        try {
          const fallback = await fallbackFilterByFullName(cleaned, limit)
          setResults(fallback)
          setError(null)
        } catch (e) {
          console.error("useDoctorLookup fallback error:", e)
          setResults([])
          setError("No se pudo obtener médicos.")
        } finally {
          setLoading(false)
        }
        return
      }
      console.error("useDoctorLookup error:", err)
      setResults([])
      setError("No se pudo obtener médicos.")
    } finally {
      if (reqId === activeReq.current) setLoading(false)
    }
  }, [limit, includeInactive, minLength])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!canSearch) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    debounceRef.current = window.setTimeout(() => { fetchDoctors(term) }, debounceMs)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [term, canSearch, debounceMs, fetchDoctors])

  const search = useCallback(async (q: string) => { await fetchDoctors(q) }, [fetchDoctors])

  const clear = useCallback(() => { setTerm(""); setResults([]); setError(null); setLoading(false) }, [])

  const pickFirst = useCallback((): DoctorLookupItem | null => (results.length ? results[0] : null), [results])

  /** “Exacta” por apellido: usa search(full_name) y cae a filtro cliente si falta el índice */
  const byLastNameExact = useCallback(async (lastName: string) => {
    const q = titleCase(lastName)
    try {
      const res = await databases.listDocuments<DoctorProfileDoc>(databaseId, userProfileCollection, [
        Query.search("full_name", q),
        Query.equal("role", "doctor"),
        Query.limit(limit),
      ])
      const docs = includeInactive ? res.documents : res.documents.filter((d) => d.is_active !== false)
      return docs.map(mapDoc)
    } catch (err) {
      if (isFulltextIndexError(err)) {
        return fallbackFilterByFullName(q, limit)
      }
      console.error("byLastNameExact error:", err)
      return [] as DoctorLookupItem[]
    }
  }, [limit, includeInactive])

  return { term, setTerm, results, loading, error, canSearch, search, clear, pickFirst, byLastNameExact }
}

export default useDoctorLookup
