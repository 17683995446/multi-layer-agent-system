import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from "framer-motion"
import { useState, useCallback, useRef, useEffect } from "react"

// ========== TOP 13: 动画引擎增强 (10个优化点) ==========

// 优化点 1: 预定义动画变体
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const slideUpVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { y: -50, opacity: 0, transition: { duration: 0.3 } },
}

export const scaleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: "backOut" } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
}

export const rotateVariants = {
  hidden: { rotate: -180, opacity: 0 },
  visible: { rotate: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
}

export const bounceVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
      mass: 0.8,
    },
  },
}

// 优化点 2: 高级序列动画
export function createStaggerChildren(delay: number = 0.1) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  }
}

export const staggeredFade = {
  container: createStaggerChildren(0.1),
  item: fadeVariants,
}

export const staggeredSlide = {
  container: createStaggerChildren(0.15),
  item: slideUpVariants,
}

// 优化点 3: 物理动画
export function useSpringAnimation(target: number, config?: { stiffness?: number; damping?: number }) {
  const x = useMotionValue(0)
  const spring = useSpring(x, {
    stiffness: config?.stiffness || 100,
    damping: config?.damping || 10,
    ...config,
  })

  const setTarget = useCallback((value: number) => {
    x.set(value)
  }, [x])

  return { spring, setTarget }
}

// 优化点 4: 视口感知动画
export function useAnimateOnView(
  options?: {
    once?: boolean
    margin?: string
  }
) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    once: options?.once || true,
    margin: options?.margin || "-100px 0px",
  })

  return { ref, isInView }
}

// 优化点 5: 颜色插值
export function useColorInterpolation(
  fromColor: string,
  toColor: string,
  progress: number
) {
  return useTransform(useSpring(progress), [0, 1], [fromColor, toColor])
}

// 优化点 6: 高级动画组件
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3, delay } },
        exit: { opacity: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { y: 50, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4, delay, ease: "easeOut" } },
        exit: { y: -50, opacity: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.3, delay, ease: "backOut" },
        },
        exit: { scale: 0.8, opacity: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 优化点 7: 序列列表动画
export function AnimatedList({
  children,
  type = "fade",
  delay = 0.1,
  className,
}: {
  children: React.ReactNode
  type?: "fade" | "slide" | "scale"
  delay?: number
  className?: string
}) {
  const containerVariants = createStaggerChildren(delay)
  let itemVariants

  switch (type) {
    case "slide":
      itemVariants = slideUpVariants
      break
    case "scale":
      itemVariants = scaleVariants
      break
    default:
      itemVariants = fadeVariants
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  )
}

// 优化点 8: 悬停交互
export function HoverScale({
  children,
  scale = 1.05,
  className,
}: {
  children: React.ReactNode
  scale?: number
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 优化点 9: 滚动驱动动画
export function useScrollAnimation() {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 100], [1, 0])
  const scale = useTransform(y, [0, 100], [1, 0.9])

  const handleScroll = useCallback((scrollY: number) => {
    y.set(scrollY)
  }, [y])

  return { y, opacity, scale, handleScroll }
}

// 优化点 10: 复杂过渡配置
export const advancedTransitions = {
  default: { duration: 0.3, ease: "easeInOut" },
  quick: { duration: 0.15, ease: "easeOut" },
  slow: { duration: 0.6, ease: "easeInOut" },
  bounce: { type: "spring", stiffness: 300, damping: 20 },
  elastic: { type: "spring", stiffness: 100, damping: 5 },
}

// 动画组合工具
export function combineVariants(...variants: any[]) {
  return variants.reduce((acc, curr) => ({ ...acc, ...curr }), {})
}

// 性能优化的动画
export function useOptimizedMotion() {
  return {
    layout: true,
    layoutId: "optimized-layout",
  }
}
