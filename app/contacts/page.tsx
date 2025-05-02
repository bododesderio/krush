import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ContactsList } from "@/components/contacts-list"

export default async function ContactsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <ContactsList currentUser={user} />
}
