import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient, getProfile } from "@/lib/supabase/server"
import { NotificationsClient } from "./notifications-client"

export const metadata: Metadata = {
  title: "Notifications",
}

export default async function NotificationsPage() {
  const profile = await getProfile()
  if (!profile) redirect("/signin?redirect=/notifications")

  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, report:reports(id, title)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Notifications</h1>
      <NotificationsClient notifications={notifications || []} />
    </div>
  )
}
