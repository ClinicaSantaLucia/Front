import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Suspense, lazy } from "react"
import { AuthProvider } from "./context/AuthContext"
import Spinner from "./components/ui/Loader"
import PrivateRoute from "./components/layout/PrivateRoute"

const LoginPage = lazy(() => import("./pages/LoginPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const HistoriasClinicasPage = lazy(() => import("./pages/HistoriasClinicasPage"))
const BuscadorHistoriasPage = lazy(() => import("./pages/VerHistoriaPage"))
const AdminPage = lazy(() => import("./pages/AdminPage"))

const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen text-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
    <div>
      <h1 className="text-5xl font-extrabold mb-4">404</h1>
      <p className="text-xl">Página no encontrada</p>
      <a
        href="/"
        className="mt-4 inline-block text-blue-600 hover:underline transition"
      >
        Volver al inicio
      </a>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/historias"
              element={
                <PrivateRoute>
                  <HistoriasClinicasPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/buscador"
              element={
                <PrivateRoute>
                  <BuscadorHistoriasPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  )
}

export default App
