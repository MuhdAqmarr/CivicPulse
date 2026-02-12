"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, Plus, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface MobileNavProps {
  profile: Profile | null
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/feed", icon: List, label: "Feed" },
    ...(profile
      ? [
          { href: "/create", icon: Plus, label: "Report", isFab: true },
          { href: "/notifications", icon: Bell, label: "Alerts" },
          { href: "/me", icon: User, label: "Profile" },
        ]
      : [
          { href: "/signin", icon: User, label: "Sign In" },
        ]),
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon

          if ((item as { isFab?: boolean }).isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
