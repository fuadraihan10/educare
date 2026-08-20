"use client"

import { useReducedMotion, motion } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimatedContainerProps {
  className?: string
  delay?: number
  children: React.ReactNode
}

function AnimatedContainer({
  className,
  delay = 0,
  children,
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export { AnimatedContainer }
