"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { ReportStatus } from "@/lib/types"

export async function createReport(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const title = (formData.get("title") as string)?.trim()
    const description = (formData.get("description") as string)?.trim() ?? ""
    const category = formData.get("category") as string
    const location_lat = formData.get("location_lat")
      ? parseFloat(formData.get("location_lat") as string)
      : null
    const location_lng = formData.get("location_lng")
      ? parseFloat(formData.get("location_lng") as string)
      : null
    const location_is_exact =
      formData.get("location_is_exact") === "true"
    const location_label =
      (formData.get("location_label") as string)?.trim() || null
    const photo_path =
      (formData.get("photo_path") as string)?.trim() || null

    // Validate title
    if (!title || title.length < 3 || title.length > 200) {
      return { error: "Title must be between 3 and 200 characters." }
    }

    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to create a report." }
    }

    // Rate limit: check if user created a report in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: recentReports } = await supabase
      .from("reports")
      .select("id")
      .eq("creator_id", user.id)
      .gte("created_at", twoMinutesAgo)
      .limit(1)

    if (recentReports && recentReports.length > 0) {
      return {
        error:
          "You are creating reports too quickly. Please wait 2 minutes before submitting again.",
      }
    }

    // Insert the report
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        creator_id: user.id,
        title,
        description,
        category,
        location_lat,
        location_lng,
        location_is_exact,
        location_label,
        photo_path,
        status: "OPEN" as ReportStatus,
      })
      .select("id")
      .single()

    if (insertError || !report) {
      return { error: insertError?.message ?? "Failed to create report." }
    }

    revalidatePath("/")
    revalidatePath("/reports")
    redirect(`/r/${report.id}`)
  } catch (error: unknown) {
    // Next.js redirect throws a special error — let it propagate
    if (
      error instanceof Error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function updateReport(
  reportId: string,
  data: { title?: string; description?: string; category?: string }
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    // Check if user is creator or admin
    const { data: report } = await supabase
      .from("reports")
      .select("creator_id")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (report.creator_id !== user.id && profile?.role !== "admin") {
      return { error: "You do not have permission to update this report." }
    }

    // Validate title if provided
    if (data.title !== undefined) {
      const trimmedTitle = data.title.trim()
      if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
        return { error: "Title must be between 3 and 200 characters." }
      }
      data.title = trimmedTitle
    }

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {}
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.description !== undefined)
      updatePayload.description = data.description.trim()
    if (data.category !== undefined) updatePayload.category = data.category

    const { error: updateError } = await supabase
      .from("reports")
      .update(updatePayload)
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    return {}
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function changeStatus(
  reportId: string,
  newStatus: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    // Check if user is creator or admin
    const { data: report } = await supabase
      .from("reports")
      .select("creator_id, status")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (report.creator_id !== user.id && profile?.role !== "admin") {
      return { error: "You do not have permission to change this status." }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    }

    if (newStatus === "CLOSED") {
      updatePayload.closed_by = user.id
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update(updatePayload)
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Insert a report_update with type STATUS_CHANGE
    const { error: insertError } = await supabase
      .from("report_updates")
      .insert({
        report_id: reportId,
        author_id: user.id,
        type: "STATUS_CHANGE",
        content: `Status changed from ${report.status} to ${newStatus}`,
        new_status: newStatus,
      })

    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    return {}
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function closeReport(
  reportId: string,
  closureNote: string,
  closurePhotoPath?: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    // Check if user is creator or admin
    const { data: report } = await supabase
      .from("reports")
      .select("creator_id")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (report.creator_id !== user.id && profile?.role !== "admin") {
      return { error: "You do not have permission to close this report." }
    }

    // Update report to CLOSED
    const updatePayload: Record<string, unknown> = {
      status: "CLOSED" as ReportStatus,
      closed_by: user.id,
      closure_note: closureNote.trim(),
    }
    if (closurePhotoPath) {
      updatePayload.closure_photo_path = closurePhotoPath
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update(updatePayload)
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Insert report_update
    const { error: insertError } = await supabase
      .from("report_updates")
      .insert({
        report_id: reportId,
        author_id: user.id,
        type: "STATUS_CHANGE",
        content: closureNote.trim(),
        new_status: "CLOSED",
      })

    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    return {}
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function markDuplicate(
  reportId: string,
  duplicateOfId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    // Admin only
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return { error: "Only admins can mark reports as duplicates." }
    }

    // Verify the target report exists
    const { data: targetReport } = await supabase
      .from("reports")
      .select("id")
      .eq("id", duplicateOfId)
      .single()

    if (!targetReport) {
      return { error: "Target duplicate report not found." }
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update({ duplicate_of: duplicateOfId })
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    return {}
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function searchDuplicates(
  title: string,
  lat?: number,
  lng?: number
): Promise<{ id: string; title: string; status: string; category: string; location_label: string | null; closure_confirmed: boolean }[]> {
  try {
    const supabase = await createClient()

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) return []

    // Use pg_trgm similarity search via ilike + bounding box
    let query = supabase
      .from("reports")
      .select("id, title, status, category, location_label, location_lat, location_lng, closure_confirmed")
      .ilike("title", `%${trimmedTitle.split(" ").slice(0, 4).join("%")}%`)
      .eq("is_hidden", false)
      .limit(5)

    if (lat !== undefined && lng !== undefined) {
      const latDelta = 2 / 111
      const lngDelta = 2 / (111 * Math.cos((lat * Math.PI) / 180))
      query = query
        .gte("location_lat", lat - latDelta)
        .lte("location_lat", lat + latDelta)
        .gte("location_lng", lng - lngDelta)
        .lte("location_lng", lng + lngDelta)
    }

    const { data } = await query
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      category: r.category,
      location_label: r.location_label,
      closure_confirmed: r.closure_confirmed,
    }))
  } catch {
    return []
  }
}
