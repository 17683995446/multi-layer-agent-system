import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  useKeyboardShortcuts,
  useKeyboardShortcut,
  useShortcutState,
  useShortcutHelp,
  commonShortcuts,
  buildKeyCombination,
  validateShortcut,
  formatShortcut,
} from "@/utils/keyboard-shortcuts-system"

describe("Top 15: 键盘快捷键系统 (10个优化点)", () => {
  describe("优化点 1-2: 核心功能", () => {
    it("useKeyboardShortcuts should initialize", () => {
      const callback = vi.fn()
      const shortcuts = [
        { id: "test", keys: "ctrl+s", description: "Test", callback },
      ]
      const { result } = renderHook(() => useKeyboardShortcuts(shortcuts))
      expect(result.current.activeShortcut).toBeNull()
    })

    it("useKeyboardShortcut should accept multiple key formats", () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useKeyboardShortcut("ctrl+s", callback))
      expect(result.current).toBeDefined()
    })
  })

  describe("优化点 3-4: 状态管理", () => {
    it("useShortcutState should track trigger count", () => {
      const { result } = renderHook(() => useShortcutState())
      expect(result.current.triggerCount).toBe(0)
      act(() => {
        result.current.trigger()
        result.current.trigger()
      })
      expect(result.current.triggerCount).toBe(2)
    })

    it("useShortcutHelp should toggle visibility", () => {
      const { result } = renderHook(() => useShortcutHelp())
      expect(result.current.showHelp).toBe(false)
      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.showHelp).toBe(true)
    })
  })

  describe("优化点 5-6: 常用快捷键预设", () => {
    it("commonShortcuts should have essential shortcuts", () => {
      expect(commonShortcuts.save).toBeDefined()
      expect(commonShortcuts.undo).toBeDefined()
      expect(commonShortcuts.redo).toBeDefined()
      expect(commonShortcuts.copy).toBeDefined()
      expect(commonShortcuts.paste).toBeDefined()
    })

    it("save shortcut should have correct keys", () => {
      expect(commonShortcuts.save.keys).toContain("ctrl+s")
      expect(commonShortcuts.save.keys).toContain("cmd+s")
    })
  })

  describe("优化点 7-8: 组合键构建", () => {
    it("buildKeyCombination should build simple keys", () => {
      const combo = buildKeyCombination("s")
      expect(combo).toBe("s")
    })

    it("buildKeyCombination should build with modifiers", () => {
      const combo = buildKeyCombination("s", { ctrl: true, shift: true })
      expect(combo).toBe("ctrl+shift+s")
    })

    it("buildKeyCombination should work with cmd", () => {
      const combo = buildKeyCombination("s", { cmd: true })
      expect(combo).toBe("cmd+s")
    })
  })

  describe("优化点 9-10: 验证和格式化", () => {
    it("validateShortcut should accept valid single key", () => {
      const validation = validateShortcut("escape")
      expect(validation.valid).toBe(true)
      expect(validation.issues.length).toBe(0)
    })

    it("validateShortcut should accept valid combination", () => {
      const validation = validateShortcut("ctrl+s")
      expect(validation.valid).toBe(true)
    })

    it("formatShortcut should format single key", () => {
      const formatted = formatShortcut("escape")
      expect(formatted).toBe("Esc")
    })

    it("formatShortcut should format combination", () => {
      const formatted = formatShortcut("ctrl+s")
      expect(formatted).toContain("Ctrl")
      expect(formatted).toContain("S")
    })

    it("formatShortcut should handle alternatives", () => {
      const formatted = formatShortcut(["ctrl+s", "cmd+s"])
      expect(formatted).toContain("/")
    })
  })

  describe("系统功能", () => {
    it("all common shortcuts should have descriptions", () => {
      Object.values(commonShortcuts).forEach((shortcut) => {
        expect(shortcut.description).toBeDefined()
        expect(shortcut.description.length).toBeGreaterThan(0)
      })
    })
  })
})
