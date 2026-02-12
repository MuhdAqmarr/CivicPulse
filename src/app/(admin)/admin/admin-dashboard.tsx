"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Flag, Eye, EyeOff, Lock, Unlock, UserX, UserCheck, Trash2, Loader2, Shield, AlertTriangle, Copy,
} from "lucide-react"
import {
  toggleHideReport,
  toggleLockComments,
  toggleBanUser,
  dismissFlag,
  adminMarkDuplicate,
} from "@/lib/actions/admin"
import { toast } from "sonner"
import { useState } from "react"

interface AdminDashboardProps {
  flaggedReports: Array<{
    id: string
    target_type: string
    target_id: string
    reason: string | null
    created_at: string
    reporter: { display_name: string | null } | null
  }>
  flaggedUpdates: Array<{
    id: string
    target_type: string
    target_id: string
    reason: string | null
    created_at: string
    reporter: { display_name: string | null } | null
  }>
  hiddenReports: Array<{
    id: string
    title: string
    status: string
    category: string
    is_hidden: boolean
    comments_locked: boolean
  }>
  recentReports: Array<{
    id: string
    title: string
    status: string
    category: string
    is_hidden: boolean
    comments_locked: boolean
    duplicate_of: string | null
    created_at: string
  }>
  bannedUsers: Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
    is_banned: boolean
    role: string
  }>
}

export function AdminDashboard({
  flaggedReports,
  flaggedUpdates,
  hiddenReports: _hiddenReports,
  recentReports,
  bannedUsers,
}: AdminDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dupInput, setDupInput] = useState<Record<string, string>>({})

  const action = (fn: () => Promise<{ error?: string } | void>, successMsg: string) => {
    startTransition(async () => {
      const result = await fn()
      if (result && "error" in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success(successMsg)
        router.refresh()
      }
    })
  }

  return (
    <Tabs defaultValue="flags">
      <TabsList className="mb-4 flex-wrap">
        <TabsTrigger value="flags" className="gap-1">
          <Flag className="h-4 w-4" />
          Flags ({flaggedReports.length + flaggedUpdates.length})
        </TabsTrigger>
        <TabsTrigger value="reports" className="gap-1">
          <Shield className="h-4 w-4" />
          Reports
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-1">
          <UserX className="h-4 w-4" />
          Banned ({bannedUsers.length})
        </TabsTrigger>
      </TabsList>

      {/* Flags Tab */}
      <TabsContent value="flags">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Flagged Reports ({flaggedReports.length})
            </h3>
            {flaggedReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flagged reports.</p>
            ) : (
              <div className="space-y-2">
                {flaggedReports.map((f) => (
                  <Card key={f.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/r/${f.target_id}`} className="text-sm font-medium text-primary hover:underline">
                          View Report
                        </Link>
                        {f.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {f.reason}</p>}
                        <p className="text-xs text-muted-foreground">
                          Flagged by: {f.reporter?.display_name || "Unknown"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => action(() => toggleHideReport(f.target_id), "Report hidden")}
                          disabled={isPending}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => action(() => dismissFlag(f.id), "Flag dismissed")}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3">Flagged Updates ({flaggedUpdates.length})</h3>
            {flaggedUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flagged updates.</p>
            ) : (
              <div className="space-y-2">
                {flaggedUpdates.map((f) => (
                  <Card key={f.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm">Update ID: {f.target_id.slice(0, 8)}...</p>
                        {f.reason && <p className="text-xs text-muted-foreground">Reason: {f.reason}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => action(() => dismissFlag(f.id), "Flag dismissed")}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Reports Tab */}
      <TabsContent value="reports">
        <div className="space-y-2">
          {recentReports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link href={`/r/${r.id}`} className="text-sm font-medium hover:text-primary truncate block">
                      {r.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                      {r.is_hidden && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
                      {r.comments_locked && <Badge variant="warning" className="text-xs">Locked</Badge>}
                      {r.duplicate_of && <Badge variant="outline" className="text-xs">Duplicate</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => action(() => toggleHideReport(r.id), r.is_hidden ? "Unhidden" : "Hidden")}
                      disabled={isPending}
                      title={r.is_hidden ? "Unhide" : "Hide"}
                    >
                      {r.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => action(() => toggleLockComments(r.id), r.comments_locked ? "Unlocked" : "Locked")}
                      disabled={isPending}
                      title={r.comments_locked ? "Unlock comments" : "Lock comments"}
                    >
                      {r.comments_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                    <div className="flex gap-1 items-center">
                      <Input
                        placeholder="Dup ID"
                        value={dupInput[r.id] || ""}
                        onChange={(e) => setDupInput({ ...dupInput, [r.id]: e.target.value })}
                        className="h-8 w-24 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (dupInput[r.id]) {
                            action(() => adminMarkDuplicate(r.id, dupInput[r.id]), "Marked as duplicate")
                          }
                        }}
                        disabled={isPending || !dupInput[r.id]}
                        title="Mark as duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Users Tab */}
      <TabsContent value="users">
        {bannedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No banned users.</p>
        ) : (
          <div className="space-y-2">
            {bannedUsers.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{u.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => action(() => toggleBanUser(u.id), "User unbanned")}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4 mr-1" />}
                    Unban
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
