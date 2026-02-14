"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ShieldCheck, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/feed"
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    })
  }

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setFormError("Invalid email or password.")
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md space-y-4">
        {/* Logo + title */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image src="/Logo.png" alt="CivicPulse" width={52} height={52} className="h-13 w-13 rounded-xl" priority />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to CivicPulse</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose how you want to sign in</p>
          </div>
        </div>

        {urlError && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 text-center">
            Authentication failed. Please try again.
          </div>
        )}

        <Tabs defaultValue="user">
          <TabsList className="w-full">
            <TabsTrigger value="user" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex-1 gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin / Judge
            </TabsTrigger>
          </TabsList>

          {/* ── Community tab ── */}
          <TabsContent value="user">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Community Member</CardTitle>
                <CardDescription className="text-xs">
                  Sign in to report issues, follow progress, and help verify fixes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleGoogleSignIn} variant="outline" size="lg" className="w-full gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By signing in, you agree to our{" "}
                  <Link href="/about#guidelines" className="underline hover:text-foreground">
                    community guidelines
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Admin / Judge tab ── */}
          <TabsContent value="admin">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admin / Judge Access</CardTitle>
                <CardDescription className="text-xs">
                  Use the credentials provided to access admin features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Demo credentials for judge */}
                <div className="rounded-md bg-muted border px-3 py-2 text-xs space-y-0.5 mb-3 font-mono">
                  <p><span className="text-muted-foreground">Email:</span> admin@gmail.com</p>
                  <p><span className="text-muted-foreground">Password:</span> admin1234</p>
                </div>

                {formError && (
                  <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 text-center mb-3">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
