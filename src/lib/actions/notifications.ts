"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function markNotificationRead(
  notificationId: string
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

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath("/notifications")
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

export async function markAllNotificationsRead(): Promise<{
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath("/notifications")
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

export async function getUnreadCount(): Promise<
  { count: number } | { error: string }
> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in." }
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)

    if (error) {
      return { error: error.message }
    }

    return { count: count ?? 0 }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}
