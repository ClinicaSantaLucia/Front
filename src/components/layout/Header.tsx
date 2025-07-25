import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { account } from "../../lib/appwrite"
import { Menu, X, LogOut, FileText, LayoutDashboard, Search, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useUser } from "../../hooks/useUser"
import logo from "../../assets/logo.jpeg"

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
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navIcons = [
    { to: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { to: "/historias", icon: <FileText />, label: "Historias" },
    { to: "/buscador", icon: <Search />, label: "Buscador" },
  ]

  // Solo agregar si es admin
  if (user?.role === "admin") {
    navIcons.push({
      to: "/admin",
      icon: <ShieldCheck />,
      label: "Admin"
    })
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "w-full sticky top-0 z-50 transition-all duration-300 backdrop-blur-md",
        scrolled ? "bg-white/80 shadow-sm" : "bg-white"
      )}
    >
      <div className="w-full px-4 py-3 flex justify-between items-center">
        {/* Logo a la izquierda */}
        <div className="flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
        <img
  src={logo}
  alt="Clínica Santa Lucía"
  className="h-10 md:h-12 lg:h-14 w-auto object-contain"
/>
        </Link>

        </div>

        {/* Íconos alineados a la derecha */}
        <div className="hidden md:flex items-center gap-4 text-gray-700">
          {navIcons.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className={clsx(
                "p-2 rounded-md hover:bg-blue-100 transition",
                location.pathname === item.to ? "text-blue-600" : ""
              )}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="p-2 rounded-md text-red-600 hover:bg-red-100 transition"
            title="Cerrar sesión"
          >
            <LogOut />
          </button>
        </div>

        {/* Menú móvil */}
        <button className="md:hidden ml-auto" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t px-4 pb-4 space-y-3"
          >
            {navIcons.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className="block text-gray-700 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left text-red-600 hover:text-red-700"
            >
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
