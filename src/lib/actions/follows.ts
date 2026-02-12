"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFollow(
  reportId: string
): Promise<{ following: boolean } | { error: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to follow a report." }
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("report_follows")
      .select("report_id")
      .eq("report_id", reportId)
      .eq("user_id", user.id)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from("report_follows")
        .delete()
        .eq("report_id", reportId)
        .eq("user_id", user.id)

      if (deleteError) {
        return { error: deleteError.message }
      }

      revalidatePath(`/r/${reportId}`)
      return { following: false }
    } else {
      // Follow
      const { error: insertError } = await supabase
        .from("report_follows")
        .insert({
          report_id: reportId,
          user_id: user.id,
        })

      if (insertError) {
        return { error: insertError.message }
      }

      revalidatePath(`/r/${reportId}`)
      return { following: true }
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}

export async function getFollowedReports(
  userId: string
): Promise<
  | {
      data: {
        report_id: string
        report: {
          id: string
          title: string
          status: string
          category: string
          created_at: string
        }
      }[]
    }
  | { error: string }
> {
  try {
    const supabase = await createClient()

    const { data: follows, error } = await supabase
      .from("report_follows")
      .select(
        `
        report_id,
        report:reports (
          id,
          title,
          status,
          category,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return {
      data: (follows ?? []) as unknown as {
        report_id: string
        report: {
          id: string
          title: string
          status: string
          category: string
          created_at: string
        }
      }[],
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}
