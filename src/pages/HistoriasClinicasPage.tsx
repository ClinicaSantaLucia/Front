import { useRef, useState } from "react"
import { databases, storage, ID, Query } from "../lib/appwrite"
import { useUser } from "../hooks/useUser"
import { UploadCloud, CheckCircle2, ChevronDown, ChevronRight, FileText, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import Header from "../components/layout/Header"
import { useDoctorLookup } from "../hooks/useDoctorLookup"
import { toast } from "sonner"

const db = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collection = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucket = import.meta.env.VITE_APPWRITE_BUCKET_ID

type FormShape = {
  year: number
  gender: "masculino" | "femenino"
  record_number: string
  admission_date: string
  discharge_date: string
  doctor_first: string
  doctor_last: string
  especialidad: string
  patient_first_name: string
  patient_last_name: string
  motivo: string
  cie10: string
  descripcion: string
  account_number: string
  observations: string
  condition: "Estable" | string
  document_type: "DNI" | "PASAPORTE" | "CARNET_EXT"
  document_number: string
  amount: string
  cancellation_date: string
  pdf: File | null
}

export default function HistoriasClinicasPage() {
  const { user } = useUser()
  const { byLastNameExact } = useDoctorLookup()

  const [form, setForm] = useState<FormShape>({
    year: new Date().getFullYear(),
    gender: "masculino",
    record_number: "",
    admission_date: "",
    discharge_date: "",
    doctor_first: "",
    doctor_last: "",
    especialidad: "",
    patient_first_name: "",
    patient_last_name: "",
    motivo: "",
    cie10: "",
    descripcion: "",
    account_number: "",
    observations: "",
    condition: "Estable",
    document_type: "DNI",
    document_number: "",
    amount: "",
    cancellation_date: "",
    pdf: null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({
    identificacion: true,
    paciente: true,
    medico: true,
    fechas: true,
    clinicos: true,
    administrativo: true,
    archivo: true,
  })
  const [activeStep, setActiveStep] = useState<number>(0)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    { id: "identificacion", label: "Identificación" },
    { id: "paciente", label: "Paciente" },
    { id: "medico", label: "Médico" },
    { id: "fechas", label: "Fechas" },
    { id: "clinicos", label: "Detalles" },
    { id: "administrativo", label: "Administrativo" },
    { id: "archivo", label: "Archivo" },
  ]

  const scrollToSection = (id: string, idx: number) => {
    const el = document.getElementById(`sec-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveStep(idx)
      setOpen((p) => ({ ...p, [id]: true }))
    }
  }

  const toggleSection = (id: string) => {
    setOpen((p) => ({ ...p, [id]: !p[id] }))
  }

  const setFieldTouched = (name: string) => {
    setTouched((p) => ({ ...p, [name]: true }))
  }

  const errors: Partial<Record<keyof FormShape, string>> = {}
  if (touched.patient_first_name && (!form.patient_first_name || form.patient_first_name.trim().length < 2)) {
    errors.patient_first_name = "Mínimo 2 caracteres"
  }
  if (touched.document_number) {
    if (form.document_type === "DNI" && !/^\d{8}$/.test(form.document_number)) {
      errors.document_number = "Debe tener 8 dígitos"
    }
    if (form.document_type !== "DNI" && !form.document_number.trim()) {
      errors.document_number = "Obligatorio"
    }
  }
  if (touched.motivo && !form.motivo) {
    errors.motivo = "Selecciona un motivo"
  }
  if (touched.descripcion && !form.descripcion.trim()) {
    errors.descripcion = "Obligatorio"
  }
  if (touched.admission_date && !form.admission_date) {
    errors.admission_date = "Obligatorio"
  }
  if (touched.discharge_date && !form.discharge_date) {
    errors.discharge_date = "Obligatorio"
  }

  const handleChange = (e: any) => {
    const { name, value, files } = e.target
    let finalValue: any = files ? files[0] : value
    const noUpper = new Set([
      "admission_date",
      "discharge_date",
      "amount",
      "gender",
      "document_type",
      "motivo",
      "cie10",
    ])

    if (name === "document_number") {
      if (form.document_type === "DNI") {
        finalValue = String(finalValue ?? "").replace(/\D+/g, "").slice(0, 8)
      }
    }

    if (name === "document_type") {
      const nextType = String(finalValue)
      if (nextType === "DNI") {
        const dn = String(form.document_number ?? "").replace(/\D+/g, "").slice(0, 8)
        setForm((prev) => ({
          ...prev,
          document_type: nextType,
          document_number: dn,
          record_number: dn,
        }))
        return
      }
    }

    if (typeof finalValue === "string" && !noUpper.has(name)) {
      finalValue = finalValue.toUpperCase()
    }

    const updatedForm: any = { ...form, [name]: finalValue }

    if (name === "document_number") {
      updatedForm.record_number = finalValue
    }

    setForm(updatedForm)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFieldTouched(e.target.name)
  }

  const handleDoctorLastEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    const query = form.doctor_last.trim()
    if (!query) return
    try {
      const matches = await byLastNameExact(query)
      if (Array.isArray(matches) && matches.length > 0) {
        const d = matches[0]
        setForm((prev) => ({
          ...prev,
          doctor_last: (d.doctor_last ?? prev.doctor_last ?? "").toString().trim(),
          doctor_first: (d.doctor_first ?? prev.doctor_first ?? "").toString().trim(),
          especialidad: (d.especialidad ?? prev.especialidad ?? "").toString().trim(),
        }))
        toast.success("Médico autocompletado")
      } else {
        toast.info("Sin coincidencias exactas")
      }
    } catch {
      toast.error("Error al autocompletar médico")
    }
  }

  const limpiarFormulario = () => {
    setForm({
      year: new Date().getFullYear(),
      gender: "masculino",
      record_number: "",
      admission_date: "",
      discharge_date: "",
      doctor_first: "",
      doctor_last: "",
      especialidad: "",
      patient_first_name: "",
      patient_last_name: "",
      motivo: "",
      cie10: "",
      descripcion: "",
      account_number: "",
      observations: "",
      condition: "Estable",
      document_type: "DNI",
      document_number: "",
      amount: "",
      cancellation_date: "",
      pdf: null,
    })
    setTouched({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ingreso = new Date(form.admission_date)
      const alta = new Date(form.discharge_date)
      const monto = parseFloat(form.amount || "0")

      if (isFinite(ingreso.getTime()) && isFinite(alta.getTime()) && alta < ingreso) {
        toast.error("La fecha de alta no puede ser anterior a la de ingreso")
        setLoading(false)
        return
      }
      if (!form.patient_first_name || form.patient_first_name.trim().length < 2) {
        toast.error("Nombre del paciente inválido")
        setLoading(false)
        return
      }
      if (!form.document_number || (form.document_type === "DNI" ? !/^\d{8}$/.test(form.document_number) : form.document_number.trim().length < 1)) {
        toast.error(form.document_type === "DNI" ? "El DNI debe tener exactamente 8 dígitos" : "Número de documento inválido")
        setLoading(false)
        return
      }
      if (!form.motivo) {
        toast.error("Selecciona el motivo")
        setLoading(false)
        return
      }
      if (!form.descripcion || form.descripcion.trim().length < 1) {
        toast.error("La descripción no puede estar vacía")
        setLoading(false)
        return
      }
      if (monto < 0) {
        toast.error("El monto debe ser positivo")
        setLoading(false)
        return
      }
      if (form.pdf && form.pdf.type !== "application/pdf") {
        toast.error("El archivo debe ser PDF")
        setLoading(false)
        return
      }

      const existing = await databases.listDocuments(db, collection, [
        Query.equal("document_number", form.document_number),
      ])
      if (existing.total > 0) {
        const confirm = window.confirm("Ya existe una historia con este número de documento. ¿Deseas continuar y asociar otra historia?")
        if (!confirm) {
          limpiarFormulario()
          setLoading(false)
          return
        }
      }

      let pdfFileId = ""
      if (form.pdf) {
        const uploaded = await storage.createFile(bucket, ID.unique(), form.pdf)
        pdfFileId = uploaded.$id
      }
const doctor_last_clean = (form.doctor_last || "").toString().trim().replace(/\s+/g, " ")
const { pdf, cie10: _omitCIE10, ...formWithoutPdf } = form

const ingresoISO = form.admission_date ? `${form.admission_date}T00:00:00.000Z` : ""
const altaISO    = form.discharge_date ? `${form.discharge_date}T00:00:00.000Z` : ""

if (!form.especialidad || !form.especialidad.trim()) {
  toast.error("La especialidad es obligatoria")
  setLoading(false)
  return
}

const MESES_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

let yearNum: number | undefined
let monthEnum: string | undefined
if (ingresoISO) {
  const d = new Date(ingresoISO)
  yearNum   = d.getUTCFullYear()          
  monthEnum = MESES_ES[d.getUTCMonth()]    
}

await databases.createDocument(db, collection, ID.unique(), {
  ...formWithoutPdf,
  admission_date: ingresoISO,
  discharge_date: altaISO,
  ...(yearNum   !== undefined ? { year:  yearNum }  : {}),
  ...(monthEnum !== undefined ? { month: monthEnum } : {}),
  doctor_last: doctor_last_clean,
  created_by: user?.user_id,
  created_at: new Date().toISOString(),
  pdf_file_id: pdfFileId || undefined,
  amount: isFinite(parseFloat(form.amount || "0")) ? parseFloat(form.amount || "0") : 0,
})

      limpiarFormulario()
      setSuccess(true)
      toast.success("Historia registrada correctamente")
      setTimeout(() => setSuccess(false), 2500)
    } catch {
      toast.error("No se pudo guardar la historia")
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    "w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
  const labelBase = "text-sm font-medium text-slate-700 mb-1"
  const helpBase = "text-xs text-slate-500 mt-1"
  const errorText = "text-xs text-rose-600 mt-1"

  const SummaryRow = ({ k, v }: { k: string; v: string }) => (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500">{k}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{v || "—"}</span>
    </div>
  )

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-white">
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Registrar Historia Clínica</h1>
              <p className="text-slate-500 text-sm">Completa los campos y adjunta el PDF si aplica.</p>
            </div>

            <div className="mb-6 overflow-x-auto">
              <ol className="flex min-w-max items-center gap-2">
                {steps.map((s, idx) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection(s.id, idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        activeStep === idx ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {idx + 1}. {s.label}
                    </button>
                    {idx < steps.length - 1 && <span className="text-slate-300">—</span>}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-6"
              >
                <div className="space-y-5">
                  <section id="sec-identificacion" className="rounded-xl border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => toggleSection("identificacion")}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-base font-semibold text-slate-800">Identificación</span>
                      {open.identificacion ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.identificacion && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>Tipo de documento</label>
                            <select
                              name="document_type"
                              value={form.document_type}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            >
                              <option value="DNI">DNI</option>
                              <option value="PASAPORTE">PASAPORTE</option>
                              <option value="CARNET_EXT">CARNET EXT</option>
                            </select>
                            <span className={helpBase}>{form.document_type === "DNI" ? "8 dígitos obligatorios" : "Introduce el código según documento"}</span>
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>N° Documento</label>
                            <input
                              name="document_number"
                              required
                              value={form.document_number}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              maxLength={form.document_type === "DNI" ? 8 : 30}
                              inputMode={form.document_type === "DNI" ? "numeric" : "text"}
                              className={inputBase}
                            />
                            {errors.document_number && <span className={errorText}>{errors.document_number}</span>}
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>N° Historia Clínica</label>
                            <input
                              name="record_number"
                              readOnly
                              value={form.record_number}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 cursor-not-allowed"
                              tabIndex={-1}
                            />
                            <span className={helpBase}>Se copia del N° de documento</span>
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Género</label>
                            <select
                              name="gender"
                              value={form.gender}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            >
                              <option value="masculino">Masculino</option>
                              <option value="femenino">Femenino</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-paciente" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("paciente")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Datos del paciente</span>
                      {open.paciente ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.paciente && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>Apellido del paciente</label>
                            <input
                              name="patient_last_name"
                              required
                              value={form.patient_last_name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                              placeholder="APELLIDOS"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Nombre del paciente</label>
                            <input
                              name="patient_first_name"
                              required
                              value={form.patient_first_name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                              placeholder="NOMBRES"
                            />
                            {errors.patient_first_name && <span className={errorText}>{errors.patient_first_name}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-medico" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("medico")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Datos del médico</span>
                      {open.medico ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.medico && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>Apellido del médico</label>
                            <input
                              name="doctor_last"
                              required
                              value={form.doctor_last}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleDoctorLastEnter}
                              placeholder="Apellidos (Enter para autocompletar)"
                              className={inputBase}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Nombre del médico</label>
                            <input
                              name="doctor_first"
                              required
                              value={form.doctor_first}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            />
                          </div>
                          <div className="flex flex-col sm:col-span-2">
                            <label className={labelBase}>Especialidad</label>
                            <input
                              name="especialidad"
                              value={form.especialidad}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-fechas" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("fechas")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Fechas y estancia</span>
                      {open.fechas ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.fechas && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>Fecha de ingreso</label>
                            <input
                              type="date"
                              required
                              name="admission_date"
                              value={form.admission_date}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            />
                            {errors.admission_date && <span className={errorText}>{errors.admission_date}</span>}
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Fecha de alta</label>
                            <input
                              type="date"
                              required
                              name="discharge_date"
                              value={form.discharge_date}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            />
                            {errors.discharge_date && <span className={errorText}>{errors.discharge_date}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-clinicos" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("clinicos")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Detalles clínicos</span>
                      {open.clinicos ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.clinicos && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>Motivo</label>
                            <select
                              name="motivo"
                              required
                              value={form.motivo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                            >
                              <option value="">Selecciona motivo</option>
                              <option value="CIRUGÍA">Cirugía</option>
                              <option value="TRATAMIENTO">Tratamiento</option>
                            </select>
                            {errors.motivo && <span className={errorText}>{errors.motivo}</span>}
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Código CIE10 (opcional)</label>
                            <input
                              name="cie10"
                              value={form.cie10}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Ej.: K80.2"
                              className={inputBase}
                            />
                            <span className={helpBase}>No es obligatorio</span>
                          </div>
                          <div className="flex flex-col sm:col-span-2">
                            <label className={labelBase}>Descripción</label>
                            <input
                              name="descripcion"
                              required
                              value={form.descripcion}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Ej.: COLELAP, APTV1"
                              className={inputBase}
                            />
                            {errors.descripcion && <span className={errorText}>{errors.descripcion}</span>}
                          </div>
                          <div className="flex flex-col sm:col-span-2">
                            <label className={labelBase}>Observaciones</label>
                            <textarea
                              name="observations"
                              value={form.observations}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={`${inputBase} h-24 resize-none`}
                              placeholder="Notas adicionales"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-administrativo" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("administrativo")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Administrativo</span>
                      {open.administrativo ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.administrativo && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className={labelBase}>N° Cuenta</label>
                            <input
                              name="account_number"
                              value={form.account_number}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                              placeholder="Opcional"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className={labelBase}>Monto</label>
                            <input
                              name="amount"
                              type="number"
                              value={form.amount}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={inputBase}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="sec-archivo" className="rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => toggleSection("archivo")} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-base font-semibold text-slate-800">Archivo PDF</span>
                      {open.archivo ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </button>
                    {open.archivo && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl grid place-items-center ${form.pdf ? "bg-emerald-50" : "bg-slate-50"}`}>
                              <FileText className={`${form.pdf ? "text-emerald-600" : "text-slate-500"} w-6 h-6`} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-800">{form.pdf ? form.pdf.name : "Sin archivo seleccionado"}</div>
                              <div className={`text-xs ${form.pdf ? "text-emerald-600" : "text-slate-500"}`}>{form.pdf ? "PDF cargado" : "Pendiente"}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <RefreshCw className="w-4 h-4" /> Reemplazar
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center">
                            <input
                              ref={fileInputRef}
                              name="pdf"
                              type="file"
                              accept=".pdf"
                              onChange={handleChange}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                            >
                              <UploadCloud className="w-4 h-4 mr-2" /> Seleccionar PDF
                            </button>
                            <span className={helpBase}>Solo PDF. Tamaño recomendado &lt; 10MB</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 bg-gradient-to-t from-white to-white/60 border-t border-slate-200/60 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={limpiarFormulario}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {loading ? "Guardando..." : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-2" /> Guardar Historia
                      </>
                    )}
                  </button>
                </div>

                {success && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2" role="status" aria-live="polite">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-sm font-medium">Historia registrada correctamente</p>
                  </motion.div>
                )}
              </motion.form>

              <aside className="lg:col-span-1">
                <div className="sticky top-6 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Resumen</h3>
                  <div className="space-y-3">
                    <SummaryRow k="Paciente" v={`${form.patient_last_name || ""}, ${form.patient_first_name || ""}`} />
                    <SummaryRow k="Documento" v={`${form.document_type} • ${form.document_number || "—"}`} />
                    <SummaryRow k="Historia" v={form.record_number || "—"} />
                    <SummaryRow k="Médico" v={`${form.doctor_last || ""} ${form.doctor_first || ""}`.trim()} />
                    <SummaryRow k="Especialidad" v={form.especialidad || "—"} />
                    <SummaryRow k="Ingreso" v={form.admission_date || "—"} />
                    <SummaryRow k="Alta" v={form.discharge_date || "—"} />
                    <SummaryRow k="Motivo" v={form.motivo || "—"} />
                    <SummaryRow k="Descripción" v={form.descripcion || "—"} />
                    <SummaryRow k="Monto" v={form.amount ? `S/ ${form.amount}` : "—"} />
                    <SummaryRow k="PDF" v={form.pdf ? form.pdf.name : "—"} />
                  </div>
                  <div className="mt-5 grid gap-2">
                    <button
                      onClick={() => document.querySelector<HTMLFormElement>("form")?.requestSubmit()}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Volver arriba
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
