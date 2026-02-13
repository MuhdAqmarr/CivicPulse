"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const CTA_VARIANTS = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

const VIEWPORT = { once: true }

export function LandingCTA() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="py-20 md:py-28" aria-labelledby="cta-heading">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-2xl mx-auto text-center rounded-2xl border bg-gradient-to-b from-primary/5 to-background p-10 md:p-14"
          variants={prefersReducedMotion ? undefined : CTA_VARIANTS}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={prefersReducedMotion ? undefined : VIEWPORT}
        >
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join your community in reporting and resolving local issues.
            Every report brings us closer to a better neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 text-base px-8">
              <Link href="/create">
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-base">
              <Link href="/about">Learn how it works</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
