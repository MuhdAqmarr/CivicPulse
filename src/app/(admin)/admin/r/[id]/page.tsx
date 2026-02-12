import { redirect } from "next/navigation"

// Admin report detail redirects to the main report page
// Admin actions are available through the main admin dashboard
export default async function AdminReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/r/${id}`)
}
