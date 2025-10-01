import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { account } from "../../lib/appwrite"
import { Menu, X, LogOut, FileText, LayoutDashboard, Search as SearchIcon, CalendarDays } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useUser } from "../../hooks/useUser"
import logo from "../../assets/logooov1.png"

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useUser()

  const handleLogout = async () => {
    await account.deleteSession("current")
    navigate("/")
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const nav = useMemo(
    () => [
      { to: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
      { to: "/historias", icon: <FileText className="w-5 h-5" />, label: "Historias" },
      { to: "/buscador", icon: <SearchIcon className="w-5 h-5" />, label: "Buscador" },
    ],
    []
  )

  const dateLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString("es-PE", { weekday: "short", year: "numeric", month: "short", day: "2-digit" })
  }, [])

  const initials = useMemo(() => {
    const name = user?.full_name || ""
    const [a = "", b = ""] = name.split(" ")
    return (a[0] || "").concat(b[0] || "").toUpperCase() || "U"
  }, [user?.full_name])

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/75",
        scrolled ? "shadow-sm" : "shadow-none"
      )}
    >
      <div className="w-full px-2 sm:px-3">
        <div className="h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center pl-1">
            <img src={logo} alt="Clínica Santa Lucía" className="h-20 md:h-24 w-auto object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-2 pr-1">
            {nav.map((item) => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={clsx(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                    active ? "text-sky-700 bg-sky-50" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              )
            })}

            <div className="hidden xl:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">{dateLabel}</span>
            </div>

            <div className="h-10 w-10 rounded-full bg-slate-900 text-white grid place-items-center text-sm font-semibold select-none uppercase ml-2">
              {initials}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <button
            className="md:hidden ml-auto inline-flex items-center justify-center rounded-xl p-2 mr-1 hover:bg-slate-100"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Menú"
          >
            {menuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-white"
          >
            <div className="w-full px-2 sm:px-3 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {nav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
                      location.pathname.startsWith(item.to)
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-semibold uppercase">
                    {initials}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-900">{user?.full_name || "Usuario"}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700">
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
