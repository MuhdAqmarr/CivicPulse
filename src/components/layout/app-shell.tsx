"use client"

import { Navbar } from "./navbar"
import { MobileNav } from "./mobile-nav"
import { Footer } from "./footer"
import type { Profile } from "@/lib/types"

interface AppShellProps {
  children: React.ReactNode
  profile: Profile | null
}

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <>
      <Navbar profile={profile} />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileNav profile={profile} />
    </>
  )
}
