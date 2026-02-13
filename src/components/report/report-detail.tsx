"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, MapPin, Clock, Flag, MessageSquare,
  Heart, HeartOff, Loader2, Lock, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import { UpdateTimeline } from "./update-timeline"
import { ClosureWidget } from "./closure-widget"
import { BeforeAfterReveal } from "./before-after-reveal"
import { StatusChangeDialog } from "./status-change-dialog"
import { AddCommentForm } from "./add-comment-form"
import { toggleFollow } from "@/lib/actions/follows"
import { flagItem } from "@/lib/actions/flags"
import { formatRelativeTime, getStorageUrl } from "@/lib/utils"
import { ReportMap } from "@/components/map"
import type { ReportWithDetails, Profile } from "@/lib/types"
import { useRealtime } from "@/hooks/use-realtime"
import { toast } from "sonner"

interface ReportDetailProps {
  report: ReportWithDetails
  currentProfile: Profile | null
}

export function ReportDetail({ report, currentProfile }: ReportDetailProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(report.is_following || false)
  const [followsPending, startFollowTransition] = useTransition()
  const [flagPending, startFlagTransition] = useTransition()

  const photoUrl = getStorageUrl(report.photo_path)
  const closurePhotoUrl = getStorageUrl(report.closure_photo_path)
  const isCreator = currentProfile?.id === report.creator_id
  const isAdmin = currentProfile?.role === "admin"
  const canChangeStatus = isCreator || isAdmin

  // Realtime updates for this report
  useRealtime({
    table: "report_updates",
    filter: `report_id=eq.${report.id}`,
    event: "INSERT",
    onEvent: () => router.refresh(),
    enabled: !!currentProfile,
  })

  useRealtime({
    table: "reports",
    filter: `id=eq.${report.id}`,
    event: "UPDATE",
    onEvent: () => router.refresh(),
    enabled: !!currentProfile,
  })

  const handleFollow = () => {
    if (!currentProfile) {
      router.push(`/signin?redirect=/r/${report.id}`)
      return
    }
    startFollowTransition(async () => {
      const result = await toggleFollow(report.id)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        setIsFollowing(result.following)
        toast.success(result.following ? "Following this report" : "Unfollowed")
      }
    })
  }

  const handleFlag = () => {
    if (!currentProfile) return
    startFlagTransition(async () => {
      const result = await flagItem("report", report.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Report flagged for review")
      }
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Feed
        </Link>
      </Button>

      {/* Hidden / Duplicate banners */}
      {report.is_hidden && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          This report has been hidden by a moderator.
        </div>
      )}
      {report.duplicate_of && (
        <div className="rounded-lg bg-warning/10 text-warning text-sm p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          This report has been marked as a duplicate.{" "}
          <Link href={`/r/${report.duplicate_of}`} className="underline font-medium">
            View original
          </Link>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardContent className="p-6">
          {/* Creator */}
          <Link
            href={`/u/${report.creator?.id}`}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={report.creator?.avatar_url || undefined} />
              <AvatarFallback>{(report.creator?.display_name || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{report.creator?.display_name || "Anonymous"}</span>
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight mb-3">{report.title}</h1>

          {/* Description */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{report.description}</p>

          {/* Status, Category, Time */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
            <StatusBadge status={report.status} closureConfirmed={report.closure_confirmed} />
            <Badge variant="secondary">{report.category}</Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeTime(report.created_at)}
            </span>
          </div>

          {/* Photo */}
          {photoUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
              <Image
                src={photoUrl}
                alt={`Photo of: ${report.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />
            </div>
          )}

          {/* Before/After Reveal */}
          {report.status === "CLOSED" && photoUrl && closurePhotoUrl && (
            <BeforeAfterReveal
              beforeUrl={photoUrl}
              afterUrl={closurePhotoUrl}
              title={report.title}
            />
          )}

          {/* Closure note without after photo */}
          {report.status === "CLOSED" && !closurePhotoUrl && report.closure_note && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 mb-6 text-center">
              <div className="text-2xl mb-2" aria-hidden="true">&#x1F50D;</div>
              <p className="text-sm font-medium mb-1">Awaiting Verification Photo</p>
              <p className="text-xs text-muted-foreground">
                The closer noted: &quot;{report.closure_note}&quot;
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                An &quot;after&quot; photo would help the community verify this fix.
              </p>
            </div>
          )}

          {/* Location */}
          {report.location_label && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{report.location_label}</span>
                {!report.location_is_exact && (
                  <Badge variant="outline" className="text-xs">Approximate area</Badge>
                )}
              </div>
              {report.location_lat != null && report.location_lng != null && (
                <ReportMap
                  reports={[report]}
                  interactive={false}
                  height="200px"
                  center={{ lat: report.location_lat, lng: report.location_lng }}
                  zoom={report.location_is_exact ? 15 : 13}
                  showPopups={false}
                />
              )}
            </div>
          )}

          <Separator className="my-4" />

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isFollowing ? "default" : "outline"}
              size="sm"
              onClick={handleFollow}
              disabled={followsPending}
            >
              {followsPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <HeartOff className="h-4 w-4 mr-1" />
              ) : (
                <Heart className="h-4 w-4 mr-1" />
              )}
              {isFollowing ? "Unfollow" : "Follow"}
              <span className="ml-1 text-xs">({report.follows_count})</span>
            </Button>

            {canChangeStatus && report.status !== "CLOSED" && (
              <StatusChangeDialog
                reportId={report.id}
                currentStatus={report.status}
              />
            )}

            {currentProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFlag}
                disabled={flagPending}
                className="text-muted-foreground"
              >
                <Flag className="h-4 w-4 mr-1" />
                Flag
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Closure verification widget */}
      {report.status === "CLOSED" && !report.closure_confirmed && (
        <div className="mt-6">
          <ClosureWidget
            reportId={report.id}
            closedBy={report.closed_by}
            trueVotes={report.closure_votes_true}
            falseVotes={report.closure_votes_false}
            userVote={report.user_vote ?? null}
            currentUserId={currentProfile?.id}
          />
        </div>
      )}

      {report.status === "CLOSED" && report.closure_confirmed && (
        <Card className="mt-6 border-success/50 bg-success/5">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1" aria-hidden="true">&#x2705;</div>
            <p className="font-semibold text-success">Community Verified Fixed</p>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmed by {report.closure_votes_true} community member{report.closure_votes_true !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline / Updates */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Updates &amp; Comments
          {report.comments_locked && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
        </h2>

        <UpdateTimeline updates={report.updates} />

        {/* Add comment form */}
        {currentProfile && !report.comments_locked && (
          <div className="mt-6">
            <AddCommentForm reportId={report.id} />
          </div>
        )}

        {!currentProfile && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href={`/signin?redirect=/r/${report.id}`} className="text-primary underline">
              Sign in
            </Link>{" "}
            to comment or follow this report.
          </p>
        )}
      </div>
    </div>
  )
}
