export type ReportStatus = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "CLOSED"
export type UpdateType = "COMMENT" | "UPDATE" | "STATUS_CHANGE" | "CLOSURE_REQUEST"

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  points: number
  badge_first_report: boolean
  badge_helper: boolean
  badge_resolver: boolean
  helper_actions: number
  resolver_confirmed: number
  role: "user" | "admin"
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  status: ReportStatus
  created_at: string
  updated_at: string
  location_lat: number | null
  location_lng: number | null
  location_is_exact: boolean
  location_label: string | null
  photo_path: string | null
  is_hidden: boolean
  comments_locked: boolean
  duplicate_of: string | null
  closed_by: string | null
  closure_note: string | null
  closure_photo_path: string | null
  closure_confirmed: boolean
  closure_confirmed_at: string | null
  creator?: Profile
}

export interface ReportUpdate {
  id: string
  report_id: string
  author_id: string
  type: UpdateType
  content: string
  new_status: ReportStatus | null
  created_at: string
  author?: Profile
}

export interface ReportFollow {
  report_id: string
  user_id: string
  created_at: string
}

export interface ClosureVote {
  report_id: string
  voter_id: string
  vote: boolean
  created_at: string
}

export interface Flag {
  id: string
  target_type: "report" | "update" | "profile"
  target_id: string
  reporter_id: string
  reason: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  report_id: string | null
  type: string
  title: string
  body: string | null
  created_at: string
  read_at: string | null
  report?: Report
}

export interface ReportWithDetails extends Report {
  creator: Profile
  updates: (ReportUpdate & { author: Profile })[]
  follows_count: number
  is_following?: boolean
  closure_votes_true: number
  closure_votes_false: number
  user_vote?: boolean | null
  flags_count: number
}

export const CATEGORIES = [
  "Roads & Potholes",
  "Street Lighting",
  "Waste & Litter",
  "Water & Drainage",
  "Parks & Green Spaces",
  "Public Safety",
  "Noise & Pollution",
  "Public Transport",
  "Sidewalks & Paths",
  "Graffiti & Vandalism",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]

export const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
}

export const STATUS_COLORS: Record<ReportStatus, string> = {
  OPEN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ACKNOWLEDGED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CLOSED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}
