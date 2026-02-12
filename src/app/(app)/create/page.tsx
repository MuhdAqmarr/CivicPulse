import type { Metadata } from "next"
import { getProfile } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateReportForm } from "@/components/report/create-report-form"

export const metadata: Metadata = {
  title: "Create Report",
  description: "Report a local issue in your community.",
}

export default async function CreateReportPage() {
  const profile = await getProfile()
  if (!profile) redirect("/signin?redirect=/create")
  if (profile.is_banned) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">Account Restricted</h1>
        <p className="text-muted-foreground mt-2">Your account has been restricted. You cannot create reports.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Report an Issue</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Help your community by reporting a local problem.
      </p>
      <CreateReportForm />
    </div>
  )
}
