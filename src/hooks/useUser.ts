import { useEffect, useState } from "react"
import { account, databases, ID, Query } from "../lib/appwrite"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  role: string
  specialty?: string
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    setLoading(true)
    try {
      const session = await account.get()

      const profile = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("user_id", session.$id),
      ])

      if (profile.documents.length > 0) {
        const doc = profile.documents[0]
        setUser({
          id: doc.$id,
          user_id: doc.user_id,
          full_name: doc.full_name,
          role: doc.role,
          specialty: doc.specialty,
        })
      } else {
        // ✅ Si no hay perfil, lo creamos automáticamente
        const created = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          {
            user_id: session.$id,
            full_name: session.name ?? session.email,
            role: "user", // valor por defecto
          }
        )
        setUser({
          id: created.$id,
          user_id: created.user_id,
          full_name: created.full_name,
          role: created.role,
          specialty: created.specialty,
        })
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return { user, loading, refetch: fetchUser }
}
