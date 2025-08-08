import { useState } from "react"
import { databases, storage, ID, Query } from "../lib/appwrite"
import { useUser } from "../hooks/useUser"
import { UploadCloud, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Header from "../components/layout/Header"

const db = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collection = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucket = import.meta.env.VITE_APPWRITE_BUCKET_ID

export default function HistoriasClinicasPage() {
  const { user } = useUser()
  const [form, setForm] = useState({
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
    pdf: null as File | null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: any) => {
    const { name, value, files } = e.target
    let finalValue = files ? files[0] : value

    if (
      typeof finalValue === "string" &&
      !["admission_date", "discharge_date", "amount"].includes(name)
    ) {
      finalValue = finalValue.toUpperCase()
    }

    const updatedForm: any = { ...form, [name]: finalValue }
    if (name === "document_number") {
      updatedForm.record_number = finalValue
    }
    setForm(updatedForm)
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const ingreso = new Date(form.admission_date)
      const alta = new Date(form.discharge_date)
      const monto = parseFloat(form.amount)

      if (alta < ingreso) {
        alert("La fecha de alta no puede ser anterior a la de ingreso.")
        setLoading(false); return
      }
      if (!form.patient_first_name || form.patient_first_name.length < 2) {
        alert("Nombre del paciente inválido.")
        setLoading(false); return
      }
      if (!form.document_number || form.document_number.length < 6) {
        alert("Número de documento inválido.")
        setLoading(false); return
      }
      if (!form.motivo) {
        alert("Debes seleccionar el motivo.")
        setLoading(false); return
      }
      if (!form.cie10 || form.cie10.length < 3) {
        alert("Código CIE10 inválido.")
        setLoading(false); return
      }
      if (!form.descripcion || form.descripcion.length < 5) {
        alert("La descripción debe tener al menos 5 caracteres.")
        setLoading(false); return
      }
      if (monto < 0) {
        alert("El monto debe ser positivo.")
        setLoading(false); return
      }
      if (form.pdf && form.pdf.type !== "application/pdf") {
        alert("El archivo debe ser un PDF válido.")
        setLoading(false); return
      }

      const existing = await databases.listDocuments(db, collection, [
        Query.equal("document_number", form.document_number),
      ])
      if (existing.total > 0) {
        const confirm = window.confirm(
          "Ya existe una historia con este número de documento. ¿Deseas continuar y asociar otra historia?"
        )
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

      const { pdf, ...formWithoutPdf } = form
      await databases.createDocument(db, collection, ID.unique(), {
        ...formWithoutPdf,
        created_by: user?.user_id,
        created_at: new Date().toISOString(),
        pdf_file_id: pdfFileId || undefined,
        amount: parseFloat(form.amount),
      })

      limpiarFormulario()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // estilos reutilizables (solo UI)
  const inputBase =
    "w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-slate-800 placeholder:text-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"

  const labelBase = "text-sm font-medium text-slate-600 mb-1"

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-white">
        <main className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto">
            {/* Título */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-semibold text-slate-800">Registrar Historia Clínica</h1>
              <p className="text-slate-500 text-sm">Completa los campos y adjunta el PDF si aplica.</p>
            </motion.div>

            {/* Card Formulario */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-6"
            >
              <div className="space-y-8">
                {/* Sección: Identificación */}
                <section>
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Identificación</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>Tipo de documento</label>
                      <select
                        name="document_type"
                        value={form.document_type}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option>DNI</option>
                        <option>PASAPORTE</option>
                        <option>CARNET EXT</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className={labelBase}>N° Documento</label>
                      <input
                        name="document_number"
                        required
                        value={form.document_number}
                        onChange={handleChange}
                        className={inputBase}
                      />
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
                      <span className="text-xs text-slate-400 mt-1">Se copia del N° de documento.</span>
                    </div>

                    <div className="flex flex-col">
                      <label className={labelBase}>Género</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Sección: Paciente */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Datos del paciente</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>Apellido del paciente</label>
                      <input
                        name="patient_last_name"
                        required
                        value={form.patient_last_name}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelBase}>Nombre del paciente</label>
                      <input
                        name="patient_first_name"
                        required
                        value={form.patient_first_name}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                  </div>
                </section>

                {/* Sección: Médico */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Datos del médico</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>Apellido del médico</label>
                      <input
                        name="doctor_last"
                        required
                        value={form.doctor_last}
                        onChange={handleChange}
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
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col sm:col-span-2">
                      <label className={labelBase}>Especialidad</label>
                      <input
                        name="especialidad"
                        value={form.especialidad}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                  </div>
                </section>

                {/* Sección: Fechas y estancia */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Fechas y estancia</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>Fecha de ingreso</label>
                      <input
                        type="date"
                        required
                        name="admission_date"
                        value={form.admission_date}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelBase}>Fecha de alta</label>
                      <input
                        type="date"
                        required
                        name="discharge_date"
                        value={form.discharge_date}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                  </div>
                </section>

                {/* Sección: Detalles clínicos */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Detalles clínicos</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>Motivo</label>
                      <select
                        name="motivo"
                        required
                        value={form.motivo}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="">Selecciona motivo</option>
                        <option value="CIRUGÍA">Cirugía</option>
                        <option value="TRATAMIENTO">Tratamiento</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className={labelBase}>Código CIE10</label>
                      <input
                        name="cie10"
                        required
                        value={form.cie10}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col sm:col-span-2">
                      <label className={labelBase}>Descripción</label>
                      <input
                        name="descripcion"
                        required
                        value={form.descripcion}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col sm:col-span-2">
                      <label className={labelBase}>Observaciones</label>
                      <textarea
                        name="observations"
                        value={form.observations}
                        onChange={handleChange}
                        className={`${inputBase} h-24 resize-none`}
                      />
                    </div>
                  </div>
                </section>

                {/* Sección: Administrativo */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Administrativo</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelBase}>N° Cuenta</label>
                      <input
                        name="account_number"
                        value={form.account_number}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelBase}>Monto</label>
                      <input
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        className={inputBase}
                      />
                    </div>
                  </div>
                </section>

                {/* Sección: Archivo */}
                <section className="pt-4 border-t border-slate-200/70">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Archivo adjunto (opcional)</h2>
                  <div className="grid sm:grid-cols-2 gap-4 items-center">
                    <input
                      name="pdf"
                      type="file"
                      accept=".pdf"
                      onChange={handleChange}
                      className="block rounded-lg border border-slate-300 bg-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                    />
                    <div className="text-xs text-slate-500">
                      Solo PDF. Tamaño recomendado &lt; 10MB.
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer acciones sticky */}
              <div className="sticky bottom-0 mt-8 -mx-6 px-6 py-4 bg-gradient-to-t from-white to-white/60 border-t border-slate-200/60 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end">
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
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm font-medium">Historia registrada correctamente.</p>
                </motion.div>
              )}
            </motion.form>
          </div>
        </main>
      </div>
    </>
  )
}
