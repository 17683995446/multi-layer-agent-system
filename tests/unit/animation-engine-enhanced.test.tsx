import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import {
  fadeVariants,
  slideUpVariants,
  scaleVariants,
  rotateVariants,
  bounceVariants,
  createStaggerChildren,
  useSpringAnimation,
  useAnimateOnView,
  advancedTransitions,
  combineVariants,
} from "@/utils/animation-engine-enhanced"

describe("Top 13: 动画引擎增强 (10个优化点)", () => {
  describe("优化点 1: 预定义动画变体", () => {
    it("should have correct fade variants structure", () => {
      expect(fadeVariants.hidden).toBeDefined()
      expect(fadeVariants.visible).toBeDefined()
      expect(fadeVariants.exit).toBeDefined()
    })

    it("should have correct slide variants structure", () => {
      expect(slideUpVariants.hidden).toBeDefined()
      expect(slideUpVariants.visible).toBeDefined()
    })

    it("should have correct scale variants", () => {
      expect(scaleVariants.hidden?.scale).toBe(0.8)
      expect(scaleVariants.visible?.scale).toBe(1)
    })
  })

  describe("优化点 2: 高级序列动画", () => {
    it("createStaggerChildren should create valid variants", () => {
      const staggered = createStaggerChildren(0.2)
      expect(staggered.visible?.transition?.staggerChildren).toBe(0.2)
    })

    it("should use default delay", () => {
      const staggered = createStaggerChildren()
      expect(staggered.visible?.transition?.staggerChildren).toBe(0.1)
    })
  })

  describe("优化点 3: 物理动画", () => {
    it("useSpringAnimation should initialize", () => {
      const { result } = renderHook(() => useSpringAnimation(0))
      expect(result.current.spring).toBeDefined()
      expect(result.current.setTarget).toBeDefined()
    })

    it("should accept custom spring config", () => {
      const { result } = renderHook(() =>
        useSpringAnimation(0, { stiffness: 200, damping: 20 })
      )
      expect(result.current).toBeDefined()
    })
  })

  describe("优化点 4: 视口感知动画", () => {
    it("useAnimateOnView should return ref and state", () => {
      const { result } = renderHook(() => useAnimateOnView())
      expect(result.current.ref).toBeDefined()
      expect(result.current.isInView).toBeDefined()
    })
  })

  describe("优化点 5-9: 动画组件", () => {
    it("should have rotate variants", () => {
      expect(rotateVariants.hidden?.rotate).toBe(-180)
      expect(rotateVariants.visible?.rotate).toBe(0)
    })

    it("should have bounce variants", () => {
      expect(bounceVariants.hidden?.y).toBe(-100)
    })
  })

  describe("优化点 10: 过渡配置", () => {
    it("should have all transition types", () => {
      expect(advancedTransitions.default).toBeDefined()
      expect(advancedTransitions.quick).toBeDefined()
      expect(advancedTransitions.slow).toBeDefined()
      expect(advancedTransitions.bounce).toBeDefined()
      expect(advancedTransitions.elastic).toBeDefined()
    })

    it("quick transition should have shorter duration", () => {
      expect(advancedTransitions.quick.duration).toBeLessThan(
        advancedTransitions.slow.duration
      )
    })
  })

  describe("工具函数", () => {
    it("combineVariants should merge objects", () => {
      const v1 = { a: 1 }
      const v2 = { b: 2 }
      const combined = combineVariants(v1, v2)
      expect(combined).toEqual({ a: 1, b: 2 })
    })
  })
})
