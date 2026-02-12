import type { Metadata } from "next"
import { ArrowRight, CheckCircle2, Eye, Flag, MessageSquare, Shield, Star, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how CivicPulse works: status flow, verification process, and community guidelines.",
}

const statusFlow = [
  {
    status: "Open",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    description: "A new report has been submitted by a community member.",
  },
  {
    status: "Acknowledged",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    description: "The report has been seen and acknowledged by the creator or an admin.",
  },
  {
    status: "In Progress",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    description: "Work is underway to resolve the issue.",
  },
  {
    status: "Closed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    description: "The issue has been resolved. Community verification begins.",
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How CivicPulse Works</h1>
      <p className="text-lg text-muted-foreground mb-12">
        CivicPulse is a community-driven tool for reporting and resolving local issues.
        Here&apos;s everything you need to know.
      </p>

      {/* Status Flow */}
      <section className="mb-14" aria-labelledby="status-flow">
        <h2 id="status-flow" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ArrowRight className="h-6 w-6 text-primary" />
          Status Flow
        </h2>
        <div className="space-y-4">
          {statusFlow.map((step, i) => (
            <div key={step.status} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                {i < statusFlow.length - 1 && <div className="w-px h-8 bg-border" />}
              </div>
              <div className="flex-1 pb-4">
                <Badge className={step.color}>{step.status}</Badge>
                <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verification */}
      <section className="mb-14" id="verification" aria-labelledby="verification-heading">
        <h2 id="verification-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Community Verification
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              When a report is closed, it enters a <strong>&quot;Closed (Awaiting Verification)&quot;</strong> state.
              Community members can then vote on whether the fix is confirmed.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-semibold text-sm">Confirmed Fixed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  If 2+ community members vote &quot;Fixed&quot; and true votes outnumber false votes, the closure is confirmed.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-sm">Not Fixed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  If 2+ members vote &quot;Not Fixed&quot;, the report automatically reopens to In Progress.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Gamification */}
      <section className="mb-14" aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Points &amp; Badges
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl mb-2">&#x1F4CB;</div>
              <h3 className="font-semibold">First Report</h3>
              <p className="text-xs text-muted-foreground mt-1">Earned when you create your first report.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl mb-2">&#x1F91D;</div>
              <h3 className="font-semibold">Helper</h3>
              <p className="text-xs text-muted-foreground mt-1">Earned after posting 5 updates or comments.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl mb-2">&#x1F3C6;</div>
              <h3 className="font-semibold">Resolver</h3>
              <p className="text-xs text-muted-foreground mt-1">Earned when 2 of your closures are confirmed by the community.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guidelines */}
      <section className="mb-14" id="guidelines" aria-labelledby="guidelines-heading">
        <h2 id="guidelines-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Community Guidelines
        </h2>
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Flag className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span><strong>Be respectful.</strong> Reports and comments should be constructive and factual.</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span><strong>Be specific.</strong> Include clear descriptions and photos when possible.</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span><strong>Check for duplicates.</strong> Search before creating a new report.</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span><strong>Verify honestly.</strong> Only vote &quot;Fixed&quot; if the issue is genuinely resolved.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span><strong>No spam or abuse.</strong> Violations result in account restrictions.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/feed">
            Explore Reports
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
