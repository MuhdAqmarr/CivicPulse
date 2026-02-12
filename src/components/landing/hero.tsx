"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, CheckCircle2, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function LandingHero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    let gsapInstance: typeof import("gsap") | null = null

    const loadGsap = async () => {
      const gsapModule = await import("gsap")
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsapInstance = gsapModule
      gsapModule.gsap.registerPlugin(ScrollTrigger)

      if (heroRef.current) {
        const layers = heroRef.current.querySelectorAll(".parallax-layer")
        layers.forEach((layer, i) => {
          gsapModule.gsap.to(layer, {
            y: (i + 1) * 40,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          })
        })
      }
    }

    loadGsap()

    return () => {
      if (gsapInstance) {
        const { ScrollTrigger } = gsapInstance as unknown as { ScrollTrigger: { getAll: () => { kill: () => void }[] } }
        ScrollTrigger?.getAll?.()?.forEach((t: { kill: () => void }) => t.kill())
      }
    }
  }, [prefersReducedMotion])

  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
      }

  const stagger = prefersReducedMotion ? 0 : 0.15

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="parallax-layer absolute top-20 left-[10%] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="parallax-layer absolute top-40 right-[15%] h-60 w-60 rounded-full bg-info/5 blur-3xl" />
        <div className="parallax-layer absolute bottom-20 left-[30%] h-80 w-80 rounded-full bg-success/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Community-powered civic reporting
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance mb-6"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: stagger }}
          >
            Your neighborhood,{" "}
            <span className="text-primary">your voice</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: stagger * 2 }}
          >
            Report local issues, track their progress in real-time, and help verify
            fixes. Together, we make our communities better, one report at a time.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: stagger * 3 }}
          >
            <Button asChild size="lg" className="gap-2 text-base px-8">
              <Link href="/feed">
                Browse Reports
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link href="/create">Report an Issue</Link>
            </Button>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-16"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: stagger * 4 }}
        >
          {[
            { icon: MapPin, label: "Issues Reported", value: "Open" },
            { icon: CheckCircle2, label: "Issues Resolved", value: "Tracked" },
            { icon: Users, label: "Active Community", value: "Verified" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card/50 backdrop-blur p-4"
            >
              <stat.icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
