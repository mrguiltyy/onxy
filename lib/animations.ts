import type { Variants } from 'framer-motion'

/* ─── Easing curves ────────────────────────────────────────────── */
export const ease = {
  smooth:  [0.25, 0.1,  0.25, 1.0],   // CSS default cubic-bezier
  out:     [0.0,  0.0,  0.2,  1.0],   // Material Design decelerate
  in:      [0.4,  0.0,  1.0,  1.0],   // Material Design accelerate
  spring:  [0.43, 0.13, 0.23, 0.96],  // Tight spring feel
  water:   [0.16, 1,    0.3,  1],     // Over-damped spring — silky
} as const

/* ─── Single element variants ──────────────────────────────────── */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.6, ease: ease.water } },
}

export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0,   transition: { duration: 0.5, ease: ease.water } },
}

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const fadeLeft: Variants = {
  hidden:  { opacity: 0, x: -24, filter: 'blur(4px)' },
  visible: { opacity: 1, x: 0,   filter: 'blur(0px)', transition: { duration: 0.6, ease: ease.water } },
}

export const fadeRight: Variants = {
  hidden:  { opacity: 0, x: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, x: 0,  filter: 'blur(0px)', transition: { duration: 0.6, ease: ease.water } },
}

export const scaleUp: Variants = {
  hidden:  { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
  visible: { opacity: 1, scale: 1,    filter: 'blur(0px)', transition: { duration: 0.6, ease: ease.water } },
}

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.35, ease: ease.spring } },
}

/* ─── Container variants (stagger children) ────────────────────── */
export const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const staggerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
}

export const staggerSlow: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

/* ─── Page transition ──────────────────────────────────────────── */
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 10,  filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0,   filter: 'blur(0px)', transition: { duration: 0.45, ease: ease.water } },
  exit:    { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.25, ease: ease.in } },
}

/* ─── Card hover ───────────────────────────────────────────────── */
export const cardHover = {
  rest:  { y: 0,  boxShadow: '0 0 0px rgba(38,247,253,0)' },
  hover: { y: -4, boxShadow: '0 8px 40px rgba(38,247,253,0.12)', transition: { duration: 0.25, ease: ease.water } },
}

/* ─── Button press ─────────────────────────────────────────────── */
export const buttonTap = { scale: 0.97 }
export const buttonHover = { scale: 1.02 }
