import Link from "next/link"
import { Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              CivicPulse
            </Link>
            <p className="text-sm text-muted-foreground">
              Report local issues, track progress, and help verify fixes in your community.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/feed" className="hover:text-foreground transition-colors">Browse Reports</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/create" className="hover:text-foreground transition-colors">Create Report</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about#guidelines" className="hover:text-foreground transition-colors">Guidelines</Link></li>
              <li><Link href="/about#verification" className="hover:text-foreground transition-colors">Verification Process</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          <p>Built for the community, by the community.</p>
        </div>
      </div>
    </footer>
  )
}
