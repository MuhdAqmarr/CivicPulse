"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BadgeDisplay } from "@/components/profile/badge-display"
import { StatusBadge } from "@/components/report/status-badge"
import { Star, FileText, Heart, Loader2, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile, ReportStatus } from "@/lib/types"

interface MeClientProps {
  profile: Profile
  reports: Array<{ id: string; title: string; status: ReportStatus; category: string; created_at: string; closure_confirmed: boolean }>
  followedReports: Array<{ id: string; title: string; status: string; category: string; updated_at: string; closure_confirmed: boolean }>
}

export function MeClient({ profile, reports, followedReports }: MeClientProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile.display_name || "")
  const [saving, startSaving] = useTransition()

  const handleSave = () => {
    startSaving(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", profile.id)
      if (error) {
        toast.error("Failed to update profile")
      } else {
        toast.success("Profile updated!")
        router.refresh()
      }
    })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">{(profile.display_name || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile.display_name || "Community Member"}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {profile.points} points
                </span>
                {profile.role === "admin" && (
                  <Badge variant="default">Admin</Badge>
                )}
              </div>
              <div className="mt-2">
                <BadgeDisplay
                  firstReport={profile.badge_first_report}
                  helper={profile.badge_helper}
                  resolver={profile.badge_resolver}
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Edit name */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </h2>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="self-end"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-destructive">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reports">
        <TabsList className="w-full">
          <TabsTrigger value="reports" className="flex-1 gap-1">
            <FileText className="h-4 w-4" />
            My Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1 gap-1">
            <Heart className="h-4 w-4" />
            Following ({followedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              You haven&apos;t created any reports yet.
            </p>
          ) : (
            <div className="space-y-2 mt-4">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  href={`/r/${r.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{r.category}</Badge>
                  </div>
                  <StatusBadge status={r.status} closureConfirmed={r.closure_confirmed} className="shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following">
          {followedReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              You&apos;re not following any reports yet.
            </p>
          ) : (
            <div className="space-y-2 mt-4">
              {followedReports.map((r) => (
                <Link
                  key={r.id}
                  href={`/r/${r.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{r.category}</Badge>
                  </div>
                  <StatusBadge status={r.status as ReportStatus} closureConfirmed={r.closure_confirmed} className="shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
