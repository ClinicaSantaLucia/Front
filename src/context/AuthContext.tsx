import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { account, databases, Query, ID } from "../lib/appwrite"
import { useNavigate } from "react-router-dom"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID

interface UserProfile {
  id: string
  full_name: string
  role: string
  specialty?: string
  user_id: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUser = async () => {
    try {
      const session = await account.get()
      const profile = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("user_id", session.$id),
      ])
  
      if (profile.documents.length > 0) {
        const doc = profile.documents[0]
  
        // ❌ Bloquear si no es admin
        if (doc.role !== "admin") {
          await account.deleteSession("current")
          setUser(null)
          navigate("/unauthorized")
          return
        }
  
        // ✅ Si es admin, permitir
        const userProfile: UserProfile = {
          id: doc.$id,
          user_id: doc.user_id,
          full_name: doc.full_name,
          role: doc.role,
          specialty: doc.specialty,
        }
        setUser(userProfile)
      } else {
        // ❌ Si no tiene perfil, bloquear también
        await account.deleteSession("current")
        setUser(null)
        navigate("/unauthorized")
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }
  

  const login = async (email: string, password: string) => {
    try {
      await account.createSession(email, password)
      await fetchUser()
      navigate("/dashboard")
    } catch (err: any) {
      if (err.code === 401) {
        throw new Error("Correo o contraseña incorrectos.")
      } else if (err.code === 403) {
        throw new Error("Tu correo no ha sido verificado.")
      } else {
        throw new Error("Error desconocido al iniciar sesión.")
      }
    }
  }

  const loginWithGoogle = async () => {
    try {
      await account.createOAuth2Session(
        "google" as any, 
        `${window.location.origin}/dashboard`,
        `${window.location.origin}/`
      )
    } catch (err) {
      console.error("Error al iniciar con Google", err)
    }
  }

  const logout = async () => {
    await account.deleteSession("current")
    setUser(null)
    navigate("/")
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
