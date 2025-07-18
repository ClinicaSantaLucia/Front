import { type ReactNode, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { account, databases, Query } from "../../lib/appwrite"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID

interface PrivateRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get()
        const profile = await databases.listDocuments(databaseId, collectionId, [
          Query.equal("user_id", user.$id)
        ])
        const role = profile.documents[0]?.role

        if (!allowedRoles || allowedRoles.includes(role)) {
          setIsAllowed(true)
        } else {
          setIsAllowed(false)
        }
      } catch (err) {
        setIsAllowed(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700 font-semibold">
        Cargando...
      </div>
    )
  }

  if (!isAllowed) {
    navigate("/")
    return null
  }

  return <>{children}</>
}
