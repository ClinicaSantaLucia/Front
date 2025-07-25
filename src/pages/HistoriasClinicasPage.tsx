import { useState } from "react"
import { databases, storage, ID, Query } from "../lib/appwrite"
import { useUser } from "../hooks/useUser"
import { UploadCloud } from "lucide-react"
import { motion } from "framer-motion"
import Header from "../components/layout/Header"

const db = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collection = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucket = import.meta.env.VITE_APPWRITE_BUCKET_ID

export default function HistoriasClinicasPage() {
  const { user } = useUser()
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    month: "Enero",
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
    hc: "",
    room_number: "",
    account_number: "",
    operation: "",
    correlative: "",
    observations: "",
    condition: "Estable",
    document_type: "DNI",
    document_number: "",
    amount: "",
    igv: "",
    cancellation_date: "",
    pdf: null as File | null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: any) => {
    const { name, value, files } = e.target
    setForm({ ...form, [name]: files ? files[0] : value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const ingreso = new Date(form.admission_date)
      const alta = new Date(form.discharge_date)
      const monto = parseFloat(form.amount)
      const igv = parseFloat(form.igv)

      if (alta < ingreso) {
        alert("La fecha de alta no puede ser anterior a la de ingreso.")
        setLoading(false)
        return
      }

      if (!form.patient_first_name || form.patient_first_name.length < 2) {
        alert("Nombre del paciente inválido.")
        setLoading(false)
        return
      }

      if (!form.document_number || form.document_number.length < 6) {
        alert("Número de documento inválido.")
        setLoading(false)
        return
      }

      if (!form.motivo) {
        alert("Debes seleccionar el motivo.")
        setLoading(false)
        return
      }

      if (!form.cie10 || form.cie10.length < 3) {
        alert("Código CIE10 inválido.")
        setLoading(false)
        return
      }

      if (!form.descripcion || form.descripcion.length < 5) {
        alert("La descripción debe tener al menos 5 caracteres.")
        setLoading(false)
        return
      }

      if (monto < 0 || igv < 0) {
        alert("El monto y el IGV deben ser positivos.")
        setLoading(false)
        return
      }

      if (form.pdf && form.pdf.type !== "application/pdf") {
        alert("El archivo debe ser un PDF válido.")
        setLoading(false)
        return
      }

      const existing = await databases.listDocuments(db, collection, [
        Query.equal("document_number", form.document_number),
      ])

      const sameDniDifferentName = existing.documents.find(
        (doc) =>
          doc.patient_first_name !== form.patient_first_name ||
          doc.patient_last_name !== form.patient_last_name
      )

      if (sameDniDifferentName) {
        alert("Ya existe una historia con ese DNI pero diferente nombre.")
        setLoading(false)
        return
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
        amount: monto,
        igv: igv,
      })

      setForm({ ...form, record_number: "", pdf: null })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white px-6 py-12"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-gray-800 mb-6 text-center"
        >
          Registrar Historia Clínica
        </motion.h1>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <input name="document_number" required value={form.document_number} onChange={handleChange} placeholder="N° de documento" className="input" />

            <div className="flex flex-col">
              <label htmlFor="admission_date" className="text-sm text-gray-600 mb-1">Fecha de ingreso</label>
              <input type="date" required name="admission_date" value={form.admission_date} onChange={handleChange} className="input" />
            </div>

            <input name="patient_last_name" required value={form.patient_last_name} onChange={handleChange} placeholder="Apellido del paciente" className="input" />
            <input name="patient_first_name" required value={form.patient_first_name} onChange={handleChange} placeholder="Nombre del paciente" className="input" />

            <select name="gender" value={form.gender} onChange={handleChange} className="input">
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>

            <input name="doctor_last" required value={form.doctor_last} onChange={handleChange} placeholder="Apellido del médico" className="input" />
            <input name="doctor_first" required value={form.doctor_first} onChange={handleChange} placeholder="Nombre del médico" className="input" />
            <input
  name="especialidad"
  value={form.especialidad}
  onChange={handleChange}
  placeholder="Especialidad del médico"
  className="input"
/>

            <select name="motivo" required value={form.motivo} onChange={handleChange} className="input">
              <option value="">Selecciona motivo</option>
              <option value="cirugía">Cirugía</option>
              <option value="tratamiento">Tratamiento</option>
            </select>

            <input name="cie10" required value={form.cie10} onChange={handleChange} placeholder="Código CIE10" className="input" />
            <input name="descripcion" required value={form.descripcion} onChange={handleChange} placeholder="Descripción de cirugía o tratamiento" className="input" />

            <input name="record_number" required value={form.record_number} onChange={handleChange} placeholder="N° Record" className="input" />

            <div className="flex flex-col">
              <label htmlFor="discharge_date" className="text-sm text-gray-600 mb-1">Fecha de alta</label>
              <input type="date" required name="discharge_date" value={form.discharge_date} onChange={handleChange} className="input" />
            </div>

            <input name="account_number" value={form.account_number} onChange={handleChange} placeholder="N° Cuenta" className="input" />
            <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Monto" className="input" />

            <input name="hc" value={form.hc} onChange={handleChange} placeholder="Código HC" className="input" />
            <input name="room_number" value={form.room_number} onChange={handleChange} placeholder="Habitación" className="input" />
            <input name="operation" value={form.operation} onChange={handleChange} placeholder="Cirugía / Operación" className="input" />
            <input name="correlative" value={form.correlative} onChange={handleChange} placeholder="Correlativo" className="input" />
            <input name="igv" type="number" value={form.igv} onChange={handleChange} placeholder="IGV" className="input" />
          </div>

          <textarea name="observations" value={form.observations} onChange={handleChange} placeholder="Observaciones" className="input h-24 resize-none" />

          <div className="grid sm:grid-cols-3 gap-4">
            <select name="month" value={form.month} onChange={handleChange} className="input">
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <select name="document_type" value={form.document_type} onChange={handleChange} className="input">
              <option>DNI</option>
              <option>PASAPORTE</option>
              <option>CARNET EXT</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <input
              name="pdf"
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="block file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            <button type="submit"
              className="bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition">
              {loading ? "Guardando..." : <><UploadCloud className="w-5 h-5" /> Guardar Historia</>}
            </button>
          </div>

          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 font-medium text-center mt-4"
            >
              Historia registrada correctamente
            </motion.p>
          )}
        </motion.form>
      </motion.div>
    </>
  )
}

