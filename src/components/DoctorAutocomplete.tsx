import { useEffect, useMemo, useRef, useState } from "react"
import { databases, Query } from "../lib/appwrite"
import { Loader2, Search, User2, Check } from "lucide-react"
import type { Models } from "appwrite"
import clsx from "clsx"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const userProfileCollection =
  import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID ||
  import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID

type DoctorProfile = Models.Document & {
  full_name?: string
  specialty?: string
  role?: string
  is_active?: boolean
}

type Props = {
  onSelect: (d: { doctor_last: string; doctor_first: string; especialidad: string }) => void
  initialLastName?: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
  disabled?: boolean
}

/** utils */
function titleCase(v = "") {
  return v.toLowerCase().replace(/\s+/g, " ").replace(/(^|\s)\S/g, (t) => t.toUpperCase())
}
function norm(v?: string) {
  return (v ?? "").toString().trim()
}
function splitFullName(fullName = ""): { first: string; last: string } {
  const t = norm(fullName).split(/\s+/)
  if (t.length <= 1) return { first: "", last: titleCase(t[0] || "") }
  if (t.length === 2) return { first: titleCase(t[0]), last: titleCase(t[1]) }
  return { first: titleCase(t.slice(0, -2).join(" ")), last: titleCase(t.slice(-2).join(" ")) }
}
function isFulltextIndexError(err: unknown) {
  const msg = String((err as any)?.message ?? "")
  return /fulltext index/i.test(msg)
}

export default function DoctorAutocomplete({
  onSelect,
  initialLastName = "",
  placeholder = "Apellido del médico",
  autoFocus,
  className,
  disabled = false,
}: Props) {
  const [term, setTerm] = useState(initialLastName)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DoctorProfile[]>([])
  const [highlight, setHighlight] = useState<number>(-1)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const debounceRef = useRef<number | null>(null)

  const canSearch = useMemo(() => norm(term).length >= 2, [term])

  useEffect(() => {
    if (!canSearch) {
      setResults([])
      return
    }
    setLoading(true)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const q = [
          // REQUIERE índice full-text en `full_name`
          Query.search("full_name", term.trim()),
          Query.equal("role", "doctor"),
          // No usamos orderAsc para evitar índice "key"
          Query.limit(10),
        ]
        const res = await databases.listDocuments<DoctorProfile>(databaseId, userProfileCollection, q)
        const docs = (res.documents || []).filter((d) => d.is_active !== false)
        setResults(docs)
        setOpen(true)
        setHighlight(docs.length ? 0 : -1)
      } catch (err) {
        // Fallback si falta full-text: traer 100 y filtrar en cliente
        if (isFulltextIndexError(err)) {
          try {
            const base = await databases.listDocuments<DoctorProfile>(databaseId, userProfileCollection, [
              Query.equal("role", "doctor"),
              Query.limit(100),
            ])
            const t = norm(term).toLowerCase()
            const docs = (base.documents || [])
              .filter((d) => d.is_active !== false)
              .filter((d) => norm(d.full_name).toLowerCase().includes(t))
            setResults(docs.slice(0, 10))
            setOpen(true)
            setHighlight(docs.length ? 0 : -1)
          } catch (e) {
            console.error("DoctorAutocomplete fallback error:", e)
            setResults([])
            setOpen(false)
          } finally {
            setLoading(false)
          }
          return
        }
        console.error("Error buscando doctores:", err)
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [term, canSearch])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function choose(doc: DoctorProfile) {
    const { first, last } = splitFullName(doc.full_name || "")
    const espe = titleCase(norm(doc.specialty || ""))
    setTerm(last)
    setOpen(false)
    onSelect({ doctor_last: last, doctor_first: first, especialidad: espe })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min((results.length ? results.length - 1 : -1), h + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === "Escape") {
      setOpen(false)
    } else if (e.key === "Enter") {
      if (results.length === 1) choose(results[0])
      else if (highlight >= 0 && highlight < results.length) choose(results[highlight])
      else setOpen(true)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
            onFocus={() => canSearch && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={disabled}
            className={clsx(
              "w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2",
              "text-slate-800 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition",
              disabled && "opacity-60 cursor-not-allowed",
              className
            )}
          />
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {loading && (
          <span className="inline-flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin h-4 w-4" /> Buscando…
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul role="listbox" className="absolute z-30 mt-2 w-full max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((d, idx) => {
            const { first, last } = splitFullName(d.full_name || "")
            const espe = titleCase(norm(d.specialty || ""))
            const active = idx === highlight
            return (
              <li
                role="option"
                aria-selected={active}
                key={d.$id}
                className={clsx("flex items-center justify-between px-3 py-2 cursor-pointer",
                  active ? "bg-sky-50" : "hover:bg-slate-50")}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(d)}
              >
                <div className="flex items-center gap-2">
                  <User2 className="h-4 w-4 text-slate-500" />
                  <div>
                    <div className="text-sm text-slate-800">
                      <span className="font-medium">{last}</span>
                      {first && `, ${first}`}
                    </div>
                    {espe && <div className="text-xs text-slate-500">{espe}</div>}
                  </div>
                </div>
                {active && <Check className="h-4 w-4 text-sky-600" />}
              </li>
            )
          })}
        </ul>
      )}

      {open && !loading && canSearch && results.length === 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-2 text-sm text-slate-500">
          Sin resultados para “{term}”.
        </div>
      )}
    </div>
  )
}
