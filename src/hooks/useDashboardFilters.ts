import { useEffect, useMemo, useState } from "react"

export type DashboardFilters = {
  year: number | null
  range: "Año actual" | "YTD" | "Últimos 12 meses" | "Personalizado"
  specialty: string
  doctor: string
  procedure: string
  gender: "" | "masculino" | "femenino"
}

type Initial = Partial<DashboardFilters>

const STORAGE_KEY = "dashboard:filters:v1"

export function useDashboardFilters(initial: Initial = {}) {
  const [year, setYear] = useState<number | null>(initial.year ?? null)
  const [range, setRange] = useState<DashboardFilters["range"]>(initial.range ?? "Año actual")
  const [specialty, setSpecialty] = useState<string>(initial.specialty ?? "")
  const [doctor, setDoctor] = useState<string>(initial.doctor ?? "")
  const [procedure, setProcedure] = useState<string>(initial.procedure ?? "")
  const [gender, setGender] = useState<DashboardFilters["gender"]>(initial.gender ?? "")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as DashboardFilters
      setYear(saved.year ?? null)
      setRange(saved.range ?? "Año actual")
      setSpecialty(saved.specialty ?? "")
      setDoctor(saved.doctor ?? "")
      setProcedure(saved.procedure ?? "")
      setGender(saved.gender ?? "")
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const data: DashboardFilters = { year, range, specialty, doctor, procedure, gender }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }, [year, range, specialty, doctor, procedure, gender])

  const reset = () => {
    setYear(null)
    setRange("Año actual")
    setSpecialty("")
    setDoctor("")
    setProcedure("")
    setGender("")
  }

  const activeChips = useMemo(
    () =>
      [
        year !== null && {
          key: "year",
          label: `Año: ${year}`,
          remove: () => setYear(null),
        },
        range && range !== "Año actual" && {
          key: "range",
          label: `Rango: ${range}`,
          remove: () => setRange("Año actual"),
        },
        specialty && {
          key: "specialty",
          label: `Especialidad: ${specialty}`,
          remove: () => setSpecialty(""),
        },
        doctor && {
          key: "doctor",
          label: `Médico: ${doctor}`,
          remove: () => setDoctor(""),
        },
        procedure && {
          key: "procedure",
          label: `Procedimiento: ${procedure}`,
          remove: () => setProcedure(""),
        },
        gender && {
          key: "gender",
          label: `Sexo: ${gender === "masculino" ? "Masculino" : "Femenino"}`,
          remove: () => setGender(""),
        },
      ].filter(Boolean) as { key: string; label: string; remove: () => void }[],
    [year, range, specialty, doctor, procedure, gender]
  )

  return {
    year,
    setYear,
    range,
    setRange,
    specialty,
    setSpecialty,
    doctor,
    setDoctor,
    procedure,
    setProcedure,
    gender,
    setGender,
    reset,
    activeChips,
    toObject: (): DashboardFilters => ({ year, range, specialty, doctor, procedure, gender }),
  }
}

export default useDashboardFilters
