import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite"

const client = new Client()

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT as string)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID as string)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export { ID, Query, Permission, Role }
