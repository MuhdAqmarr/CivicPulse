import { getProfile } from "@/lib/supabase/server"
import { AppShell } from "@/components/layout/app-shell"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  return <AppShell profile={profile}>{children}</AppShell>
}
