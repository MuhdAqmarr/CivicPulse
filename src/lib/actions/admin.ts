"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function requireAdmin(): Promise<
  { userId: string; error?: undefined } | { error: string; userId?: undefined }
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be signed in." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Admin access required." }
  }

  return { userId: user.id }
}

export async function toggleHideReport(
  reportId: string
): Promise<{ error?: string }> {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) {
      return { error: adminCheck.error }
    }

    const supabase = await createClient()

    // Get current hidden state
    const { data: report } = await supabase
      .from("reports")
      .select("is_hidden")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update({ is_hidden: !report.is_hidden })
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    revalidatePath("/admin")
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

export async function toggleLockComments(
  reportId: string
): Promise<{ error?: string }> {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) {
      return { error: adminCheck.error }
    }

    const supabase = await createClient()

    // Get current locked state
    const { data: report } = await supabase
      .from("reports")
      .select("comments_locked")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update({ comments_locked: !report.comments_locked })
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath("/admin")
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

export async function toggleBanUser(
  userId: string
): Promise<{ error?: string }> {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) {
      return { error: adminCheck.error }
    }

    // Prevent admin from banning themselves
    if (adminCheck.userId === userId) {
      return { error: "You cannot ban yourself." }
    }

    const supabase = await createClient()

    // Get current banned state
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .single()

    if (!profile) {
      return { error: "User not found." }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_banned: !profile.is_banned })
      .eq("id", userId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath("/admin")
    revalidatePath(`/u/${userId}`)
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

export async function adminMarkDuplicate(
  reportId: string,
  duplicateOfId: string
): Promise<{ error?: string }> {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) {
      return { error: adminCheck.error }
    }

    const supabase = await createClient()

    // Verify both reports exist
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    const { data: targetReport } = await supabase
      .from("reports")
      .select("id")
      .eq("id", duplicateOfId)
      .single()

    if (!targetReport) {
      return { error: "Target duplicate report not found." }
    }

    // Prevent marking a report as duplicate of itself
    if (reportId === duplicateOfId) {
      return { error: "A report cannot be a duplicate of itself." }
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update({ duplicate_of: duplicateOfId })
      .eq("id", reportId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/r/${reportId}`)
    revalidatePath(`/r/${duplicateOfId}`)
    revalidatePath("/")
    revalidatePath("/reports")
    revalidatePath("/admin")
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

export async function dismissFlag(
  flagId: string
): Promise<{ error?: string }> {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) {
      return { error: adminCheck.error }
    }

    const supabase = await createClient()

    const { error: deleteError } = await supabase
      .from("flags")
      .delete()
      .eq("id", flagId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    revalidatePath("/admin")
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
