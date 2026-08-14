import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/**
 * Staggered fade-and-slide entrance for lists. Items animate in sequence on
 * mount. Framer-Motion's MotionConfig reducedMotion="user" downgrades the
 * slide to a plain fade for users who prefer reduced motion.
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}
