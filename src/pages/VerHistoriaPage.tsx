import { useEffect, useMemo, useState } from "react"
import { databases, Query } from "../lib/appwrite"
import { FileText, XCircle, Filter, X, Printer, FileDown, Save, PencilLine, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../components/layout/Header"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { toast } from "sonner"
import { Button } from "../components/ui/button"
import { useUser } from "../hooks/useUser"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT

function limpiarDocumento(doc: any) {
  const camposValidos = [
    "year","month","gender","record_number","admission_date","discharge_date","doctor_first","doctor_last",
    "account_number","operation","correlative","observations","condition","created_by","pdf_file_id","ocr_image_id",
    "ocr_text","created_at","document_type","patient_first_name","patient_last_name","amount","document_number",
    "motivo","descripcion","especialidad"
  ]
  const limpio: any = {}
  for (const campo of camposValidos) if (campo in doc) limpio[campo] = doc[campo]
  return limpio
}

function intersectDates(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string): [string | undefined, string | undefined] {
  const maxStart = [aStart, bStart].filter(Boolean).sort().slice(-1)[0]
  const minEnd   = [aEnd,   bEnd  ].filter(Boolean).sort()[0]
  if (maxStart && minEnd && maxStart > minEnd) return [undefined, undefined]
  return [maxStart, minEnd]
}

function toISODateStart(d: string) { return d.length === 10 ? `${d}T00:00:00.000Z` : d }
function nextDayISO(d: string) {
  if (d.length !== 10) return d
  const dt = new Date(`${d}T00:00:00.000Z`)
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10) + "T00:00:00.000Z"
}

export default function BuscadorHistoriasPage() {
  const { user } = useUser()

  const [filtros, setFiltros] = useState({
    q: "",
    year: "",
    doctor_last: "",
    doctor_first: "",
    patient_last_name: "",
    patient_first_name: "",
    document_number: "",
    document_type: "",
    operation: "",
    from_date: "",
    to_date: "",
    gender: "",
    motivo: "",
    descripcion: "",
    account_number: "",
    especialidad: "",
  })

  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<any | null>(null)
  const [detalleEditable, setDetalleEditable] = useState<any | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)

  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [totalFiltrado, setTotalFiltrado] = useState(0)
  const [totalGeneral, setTotalGeneral] = useState<number | null>(null)

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  const [showFilters, setShowFilters] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
    setOffset(0)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await databases.listDocuments(databaseId, collectionId, [Query.limit(1)])
        setTotalGeneral(res.total)
      } catch {}
    })()
  }, [])

  const buscar = async () => {
    setLoading(true)
    try {
      const queries: any[] = []

      let yearStart: string | undefined
      let yearEnd: string | undefined
      if (filtros.year.trim()) {
        const y = Math.max(2000, parseInt(filtros.year, 10) || 0)
        yearStart = `${y}-01-01`
        yearEnd = `${y}-12-31`
      }

      let from = filtros.from_date || undefined
      let to = filtros.to_date || undefined
      if (from && to && from > to) [from, to] = [to, from]

      const [start, end] = intersectDates(yearStart, yearEnd, from, to)
      if (start) queries.push(Query.greaterThanEqual("admission_date", toISODateStart(start)))
      if (end) queries.push(Query.lessThan("admission_date", nextDayISO(end)))

      const quick = filtros.q.trim()
      if (quick) {
        queries.push(Query.or([
          Query.search("patient_first_name", quick),
          Query.search("patient_last_name", quick),
          Query.search("doctor_first", quick),
          Query.search("doctor_last", quick),
          Query.search("descripcion", quick),
          Query.search("operation", quick),
          Query.search("document_number", quick),
          Query.search("account_number", quick),
        ]))
      }

      const pushSearch = (field: string, val: string) => {
        const v = val.trim()
        if (v) queries.push(Query.search(field, v))
      }
      pushSearch("doctor_last", filtros.doctor_last)
      pushSearch("doctor_first", filtros.doctor_first)
      pushSearch("patient_last_name", filtros.patient_last_name)
      pushSearch("patient_first_name", filtros.patient_first_name)
      pushSearch("descripcion", filtros.descripcion)
      pushSearch("especialidad", filtros.especialidad)

      const addEq = (key: string, val: string) => { if (val.trim()) queries.push(Query.equal(key, val.trim())) }
      addEq("document_number", filtros.document_number)
      addEq("document_type", filtros.document_type)
      addEq("operation", filtros.operation)
      addEq("gender", filtros.gender)
      addEq("motivo", filtros.motivo)
      addEq("account_number", filtros.account_number)

      queries.push(sortOrder === "desc" ? Query.orderDesc("admission_date") : Query.orderAsc("admission_date"))
      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset))

      const res = await databases.listDocuments(databaseId, collectionId, queries)
      setResultados(res.documents)
      setTotalFiltrado(res.total)
    } catch (err) {
      toast.error("Error al buscar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscar()
  }, [limit, offset, sortOrder])

  const rango = useMemo(() => {
    const start = resultados.length ? offset + 1 : 0
    const end = offset + resultados.length
    return { start, end }
  }, [offset, resultados])

  const exportarExcel = () => {
    const data = resultados.map((r) => ({
      "Nombre Paciente": `${r.patient_first_name ?? ""} ${r.patient_last_name ?? ""}`.trim(),
      "Nombre Médico": `${r.doctor_first ?? ""} ${r.doctor_last ?? ""}`.trim(),
      "Especialidad": r.especialidad || "",
      "Documento Tipo": r.document_type || "",
      "Documento N°": r.document_number || "",
      "HC": r.record_number || "",
      "N° Cuenta": r.account_number || "",
      "Cirugía": r.operation || "",
      "Sexo": r.gender || "",
      "Motivo": r.motivo || "",
      "Descripción": r.descripcion || "",
      "Observaciones": r.observations || "",
      "Monto": r.amount ?? "",
      "Ingreso": r.admission_date?.split("T")[0] ?? "",
      "Alta": r.discharge_date?.split("T")[0] ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Historias")
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buffer]), "historias_clinicas.xlsx")
  }

  const filtrosActivos = useMemo(() => {
    const entries: { key: keyof typeof filtros; label: string; value: string }[] = []
    for (const [k, v] of Object.entries(filtros)) {
      if (!v) continue
      const key = k as keyof typeof filtros
      let label = ""
      switch (key) {
        case "q": label = "Búsqueda"; break
        case "year": label = "Año"; break
        case "doctor_last": label = "Dr. Apellido"; break
        case "doctor_first": label = "Dr. Nombre"; break
        case "patient_last_name": label = "Pac. Apellido"; break
        case "patient_first_name": label = "Pac. Nombre"; break
        case "document_number": label = "Doc N°"; break
        case "document_type": label = "Tipo Doc"; break
        case "operation": label = "Operación"; break
        case "from_date": label = "Desde"; break
        case "to_date": label = "Hasta"; break
        case "gender": label = "Sexo"; break
        case "motivo": label = "Motivo"; break
        case "descripcion": label = "Descripción"; break
        case "account_number": label = "N° Cuenta"; break
        case "especialidad": label = "Especialidad"; break
      }
      entries.push({ key, label, value: v })
    }
    return entries
  }, [filtros])

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-white text-gray-800">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <motion.h1
              className="text-3xl font-semibold text-slate-800"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Buscador de Historias Clínicas
            </motion.h1>
            <p className="text-slate-500 text-sm">Filtra, exporta e imprime tus registros clínicos.</p>
            <p className="text-slate-500 text-xs mt-1">
              {rango.start > 0 ? `Mostrando ${rango.start}–${rango.end} de ${totalFiltrado}` : `0 resultados`}
              {typeof totalGeneral === "number" && <> · Total general: {totalGeneral}</>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportarExcel} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileDown className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="h-9">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium text-sm">Filtros</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced((s) => !s)}
                className="h-8"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                Avanzados
              </Button>
              <Button
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className="h-8 bg-slate-900 hover:bg-black text-white"
              >
                {showFilters ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <input
                  name="q"
                  placeholder="Búsqueda rápida (paciente, médico, operación, doc, cuenta...)"
                  value={filtros.q}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 lg:col-span-2"
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-gray-700 focus:ring-2 focus:ring-sky-500"
                  title="Orden por fecha de ingreso"
                >
                  <option value="desc">Recientes primero</option>
                  <option value="asc">Antiguos primero</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={buscar} className="bg-sky-600 hover:bg-sky-700 text-white w-full">
                    <Filter className="w-4 h-4 mr-2" /> Buscar
                  </Button>
                  <Button
                    onClick={() => {
                      setFiltros({
                        q: "",
                        year: "",
                        doctor_last: "",
                        doctor_first: "",
                        patient_last_name: "",
                        patient_first_name: "",
                        document_number: "",
                        document_type: "",
                        operation: "",
                        from_date: "",
                        to_date: "",
                        gender: "",
                        motivo: "",
                        descripcion: "",
                        account_number: "",
                        especialidad: "",
                      })
                      setOffset(0)
                      setResultados([])
                      setTotalFiltrado(0)
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white w-full"
                    title="Limpiar filtros"
                  >
                    <X className="w-4 h-4 mr-1" /> Limpiar
                  </Button>
                </div>
              </div>

              {showAdvanced && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input name="year" type="number" min={2000} placeholder="Año (≥ 2000)" value={filtros.year} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="doctor_first" placeholder="Nombre del médico" value={filtros.doctor_first} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="doctor_last" placeholder="Apellido del médico" value={filtros.doctor_last} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="especialidad" placeholder="Especialidad" value={filtros.especialidad} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />

                  <input name="patient_first_name" placeholder="Nombre del paciente" value={filtros.patient_first_name} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="patient_last_name" placeholder="Apellido del paciente" value={filtros.patient_last_name} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />

                  <input name="document_number" placeholder="N° Documento" value={filtros.document_number} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <select name="document_type" value={filtros.document_type} onChange={handleChange}
                          className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-gray-600 focus:ring-2 focus:ring-sky-500">
                    <option value="">Tipo de documento</option>
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="CARNET_EXT">Carnet de Extranjería</option>
                  </select>

                  <input name="account_number" placeholder="N° Cuenta" value={filtros.account_number} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="operation" placeholder="Cirugía / Operación" value={filtros.operation} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="motivo" placeholder="Motivo" value={filtros.motivo} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="descripcion" placeholder="Descripción (parcial)" value={filtros.descripcion} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />

                  <input name="from_date" type="date" value={filtros.from_date} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <input name="to_date" type="date" value={filtros.to_date} onChange={handleChange}
                         className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 focus:ring-2 focus:ring-sky-500" />
                  <select name="gender" value={filtros.gender} onChange={handleChange}
                          className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-gray-600 focus:ring-2 focus:ring-sky-500">
                    <option value="">Sexo</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>
              )}

              {filtrosActivos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filtrosActivos.map((f) => (
                    <span key={String(f.key)} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">
                      <strong className="mr-1">{f.label}:</strong> {f.value}
                      <button
                        className="ml-1 hover:text-rose-600"
                        onClick={() => { setFiltros((prev) => ({ ...prev, [f.key]: "" })); setOffset(0) }}
                        title="Quitar filtro"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 mt-6 pb-28 max-w-7xl mx-auto">
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur border-b border-slate-200/60">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-2 font-semibold">Paciente</th>
                <th className="px-4 py-2 font-semibold">Médico</th>
                <th className="px-4 py-2 font-semibold">Especialidad</th>
                <th className="px-4 py-2 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                    onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                    title={`Ordenar por ingreso (${sortOrder === "desc" ? "↓" : "↑"})`}
                  >
                    Ingreso
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-4 py-2 font-semibold">Motivo</th>
                <th className="px-4 py-2 font-semibold">Descripción</th>
                <th className="px-4 py-2 font-semibold text-right pr-5">Acciones</th>
              </tr>
            </thead>

            {loading ? (
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-36 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-44 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-3 text-right pr-5"><div className="h-4 w-20 bg-slate-100 animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            ) : resultados.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {resultados.map((r, idx) => (
                  <tr key={r.$id} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.patient_last_name}, {r.patient_first_name}</div>
                      <div className="text-xs text-slate-500">{r.document_type} · {r.document_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{r.doctor_last}, {r.doctor_first}</div>
                      <div className="text-xs text-slate-500">{r.gender || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">{r.especialidad || "—"}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.admission_date?.split("T")[0]}</td>
                    <td className="px-4 py-3">{r.motivo || "—"}</td>
                    <td className="px-4 py-3 truncate max-w-[320px]" title={r.descripcion || ""}>{r.descripcion || "—"}</td>
                    <td className="px-4 py-3 text-right pr-5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Ver detalle"
                          onClick={() => { setDetalle(r); setDetalleEditable(r); setModoEdicion(false) }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.pdf_file_id && (
                          <a
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Ver PDF"
                            target="_blank"
                            href={`${endpoint}/storage/buckets/${bucketId}/files/${r.pdf_file_id}/download?project=${projectId}`}
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          className="p-2 rounded-lg hover:bg-slate-100 text-amber-600"
                          title="Editar"
                          onClick={() => { setDetalle(r); setDetalleEditable(r); setModoEdicion(true) }}
                        >
                          <PencilLine className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center">
                      <XCircle className="w-12 h-12 text-slate-400 mb-2" />
                      <p className="text-lg font-medium">No se encontraron resultados</p>
                      <p className="text-sm">Prueba con otros filtros o un rango de fechas distinto.</p>
                      {(user?.role && user.role !== "viewer") && (
                        <a
                          href="/historias/nueva"
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                        >
                          Crear historia
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-600">
          <div className="mr-auto">
            {rango.start > 0 ? `Mostrando ${rango.start}–${rango.end} de ${totalFiltrado}` : "Sin resultados"}
          </div>
          <select
            value={limit}
            onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0) }}
            className="bg-white/90 backdrop-blur shadow border border-slate-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            title="Resultados por página"
          >
            {[10,20,50,100].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <Button
            variant="outline"
            className="h-8"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            className="h-8"
            disabled={offset + limit >= totalFiltrado}
            onClick={() => setOffset((o) => o + limit)}
            title="Siguiente"
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      <div className="hidden print:block px-10 pt-10 text-black">
        <h2 className="text-2xl font-bold mb-4 text-center">Historias Clínicas</h2>
        {resultados.map((r) => (
          <div key={r.$id} className="mb-6 border-b border-gray-400 pb-4">
            <p><strong>Paciente:</strong> {r.patient_first_name} {r.patient_last_name}</p>
            <p><strong>Médico:</strong> {r.doctor_first} {r.doctor_last}</p>
            <p><strong>Especialidad:</strong> {r.especialidad}</p>
            <p><strong>Documento:</strong> {r.document_type} {r.document_number}</p>
            <p><strong>HC:</strong> {r.record_number}</p>
            <p><strong>Cuenta:</strong> {r.account_number}</p>
            <p><strong>Cirugía:</strong> {r.operation}</p>
            <p><strong>Sexo:</strong> {r.gender}</p>
            <p><strong>Motivo:</strong> {r.motivo}</p>
            <p><strong>Descripción:</strong> {r.descripcion}</p>
            <p><strong>Observaciones:</strong> {r.observations}</p>
            <p><strong>Monto:</strong> S/ {r.amount}</p>
            <p><strong>Ingreso:</strong> {r.admission_date?.split("T")[0]}</p>
            <p><strong>Alta:</strong> {r.discharge_date?.split("T")[0]}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {detalle && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full shadow-xl relative max-h-[85vh] overflow-y-auto border border-slate-200/60"
              initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 rounded-t-2xl p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {detalle.patient_last_name}, {detalle.patient_first_name}
                </h2>
                <div className="flex gap-2">
                  {!modoEdicion && (
                    <Button onClick={() => setModoEdicion(true)} className="h-9 bg-amber-500 hover:bg-amber-600 text-white">
                      <PencilLine className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  )}
                  <button
                    onClick={() => { setDetalle(null); setModoEdicion(false) }}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                    aria-label="Cerrar"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
                  <p className="col-span-2">
                    <strong>Médico:</strong>
                    {modoEdicion ? (
                      <>
                        <input
                          value={detalleEditable?.doctor_first || ""}
                          onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_first: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Nombre"
                        />
                        <input
                          value={detalleEditable?.doctor_last || ""}
                          onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_last: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Apellido"
                        />
                      </>
                    ) : (
                      ` ${detalle.doctor_first} ${detalle.doctor_last}`
                    )}
                  </p>

                  <p>
                    <strong>Especialidad:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.especialidad || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, especialidad: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : (detalle.especialidad)}
                  </p>

                  <p>
                    <strong>Sexo:</strong>
                    {modoEdicion ? (
                      <select
                        value={detalleEditable?.gender || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, gender: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                    ) : (detalle.gender)}
                  </p>

                  <p>
                    <strong>N° Cuenta:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.account_number || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, account_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.account_number}
                  </p>

                  <p>
                    <strong>Código HC:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.record_number || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, record_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.record_number}
                  </p>

                  <p>
                    <strong>Tipo Doc:</strong>
                    {modoEdicion ? (
                      <select
                        value={detalleEditable?.document_type || ""}
                        onChange={(e) =>
                          setDetalleEditable((prev: any) => ({
                            ...prev,
                            document_type: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="DNI">DNI</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="CARNET_EXT">Carnet de Extranjería</option>
                      </select>
                    ) : (
                      detalle.document_type
                    )}
                  </p>

                  <p>
                    <strong>Doc N°:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.document_number || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, document_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.document_number}
                  </p>

                  <p>
                    <strong>Ingreso:</strong>
                    {modoEdicion ? (
                      <input
                        type="date"
                        value={(detalleEditable?.admission_date || "").slice(0,10)}
                        onChange={(e) =>
                          setDetalleEditable((prev: any) => ({
                            ...prev,
                            admission_date: e.target.value ? `${e.target.value}T00:00:00.000Z` : ""
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : (
                      detalle.admission_date?.split("T")[0]
                    )}
                  </p>

                  <p>
                    <strong>Alta:</strong>
                    {modoEdicion ? (
                      <input
                        type="date"
                        min={(detalleEditable?.admission_date || "").slice(0,10)}
                        value={(detalleEditable?.discharge_date || "").slice(0,10)}
                        onChange={(e) =>
                          setDetalleEditable((prev: any) => ({
                            ...prev,
                            discharge_date: e.target.value ? `${e.target.value}T00:00:00.000Z` : ""
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : (
                      detalle.discharge_date?.split("T")[0]
                    )}
                  </p>

                  <p>
                    <strong>Cirugía:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.operation || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, operation: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.operation}
                  </p>

                  <p>
                    <strong>Correlativo:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.correlative || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, correlative: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.correlative}
                  </p>

                  <p>
                    <strong>Monto:</strong>
                    {modoEdicion ? (
                      <input
                        type="number"
                        value={detalleEditable?.amount ?? ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, amount: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : `S/ ${detalle.amount}`}
                  </p>

                  <p className="col-span-2">
                    <strong>Motivo:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.motivo || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, motivo: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.motivo}
                  </p>

                  <p className="col-span-2">
                    <strong>Descripción:</strong>
                    {modoEdicion ? (
                      <textarea
                        value={detalleEditable?.descripcion || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.descripcion}
                  </p>

                  <p className="col-span-2">
                    <strong>Observaciones:</strong>
                    {modoEdicion ? (
                      <textarea
                        value={detalleEditable?.observations || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, observations: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.observations}
                  </p>
                </div>

                <div className="sticky bottom-0 pt-4 mt-6 bg-gradient-to-t from-white to-white/60">
                  {modoEdicion && (
                    <Button
                      onClick={async () => {


                        
                        try {
                          const limpio: any = limpiarDocumento({ ...detalleEditable })
                        
                          if (!limpio.discharge_date && detalle?.discharge_date) {
                            limpio.discharge_date = detalle.discharge_date
                          }
                        
                          if (limpio.admission_date && limpio.discharge_date &&
                              new Date(limpio.discharge_date) < new Date(limpio.admission_date)) {
                            toast.error("La fecha de alta no puede ser anterior a la fecha de ingreso.")
                            return
                          }
                        
                          const MESES_ES = [
                            "Enero","Febrero","Marzo","Abril","Mayo","Junio",
                            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
                          ]
                        
                          const fechaBaseISO =
                            limpio.admission_date ||
                            detalleEditable?.admission_date ||
                            detalle?.admission_date || ""
                        
                          if (fechaBaseISO) {
                            const d = new Date(fechaBaseISO)
                            limpio.year = d.getUTCFullYear()
                            limpio.month = MESES_ES[d.getUTCMonth()]
                          } else {
                            const m = (limpio.month ?? "").toString().trim()
                            const matchNum = m.match(/^0?([1-9])$|^(1[0-2])$/)
                            if (matchNum) {
                              const idx = (parseInt(matchNum[1] || matchNum[2], 10) - 1)
                              limpio.month = MESES_ES[idx]
                            } else if (!MESES_ES.includes(m)) {
                              delete limpio.month
                              delete limpio.year
                            }
                          }
                        
                          await databases.updateDocument(databaseId, collectionId, detalleEditable.$id, limpio)
                          toast.success("Historia clínica actualizada correctamente.")
                          setDetalle(null)
                          setModoEdicion(false)
                          buscar()
                        } catch {
                          toast.error("Error al guardar cambios.")
                        }
                        
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                    </Button>
                  )}

                  {detalle?.pdf_file_id && (
                    <a
                      href={`${endpoint}/storage/buckets/${bucketId}/files/${detalle.pdf_file_id}/download?project=${projectId}`}
                      target="_blank"
                      className="block mt-3 text-sky-700 hover:underline font-medium text-sm"
                    >
                      Descargar PDF completo
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
