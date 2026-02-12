import { getProfile } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile || profile.role !== "admin") redirect("/feed")

  return <AppShell profile={profile}>{children}</AppShell>
}
