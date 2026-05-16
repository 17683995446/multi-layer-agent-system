import { useState, useEffect, useCallback, useRef } from "react"

// ========== TOP 15: 键盘快捷键系统 (10个优化点) ==========

interface Shortcut {
  id: string
  keys: string | string[]
  description: string
  callback: () => void
  preventDefault?: boolean
  stopPropagation?: boolean
}

// 优化点 1: 核心键盘 Hook
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null)
  const pressedKeys = useRef<Set<string>>(new Set())
  const lastKeyTime = useRef<number>(0)

  // 优化点 2: 键序列解析
  const parseKeySequence = useCallback((keys: string | string[]): string[][] => {
    if (Array.isArray(keys)) {
      return keys.map((k) => k.split("+").map((key) => key.trim().toLowerCase()))
    }
    return [keys.split("+").map((key) => key.trim().toLowerCase())]
  }, [])

  // 优化点 3: 序列匹配
  const matchesKeySequence = useCallback(
    (pressed: Set<string>, sequences: string[][]) => {
      return sequences.some((sequence) => {
        if (sequence.length === 1) {
          return pressed.has(sequence[0])
        }
        return sequence.every((key) => pressed.has(key))
      })
    },
    []
  )

  // 优化点 4: 键盘事件处理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const now = Date.now()

      // 添加修饰键
      if (event.ctrlKey) pressedKeys.current.add("ctrl")
      if (event.metaKey) pressedKeys.current.add("cmd")
      if (event.altKey) pressedKeys.current.add("alt")
      if (event.shiftKey) pressedKeys.current.add("shift")

      // 添加主要键
      if (
        key !== "control" &&
        key !== "meta" &&
        key !== "alt" &&
        key !== "shift"
      ) {
        pressedKeys.current.add(key)
      }

      // 检查匹配的快捷键
      for (const shortcut of shortcuts) {
        const sequences = parseKeySequence(shortcut.keys)
        if (matchesKeySequence(pressedKeys.current, sequences)) {
          if (shortcut.preventDefault !== false) event.preventDefault()
          if (shortcut.stopPropagation !== false) event.stopPropagation()

          setActiveShortcut(shortcut.id)
          shortcut.callback()
          lastKeyTime.current = now
          break
        }
      }
    },
    [shortcuts, parseKeySequence, matchesKeySequence]
  )

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase()

    pressedKeys.current.delete(key)

    // 也清理修饰键
    if (!event.ctrlKey) pressedKeys.current.delete("ctrl")
    if (!event.metaKey) pressedKeys.current.delete("cmd")
    if (!event.altKey) pressedKeys.current.delete("alt")
    if (!event.shiftKey) pressedKeys.current.delete("shift")

    setActiveShortcut(null)
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      pressedKeys.current.clear()
    }
  }, [handleKeyDown, handleKeyUp])

  return { activeShortcut }
}

// 优化点 5: 单个快捷键 Hook
export function useKeyboardShortcut(
  keys: string | string[],
  callback: () => void,
  options?: {
    preventDefault?: boolean
    stopPropagation?: boolean
  }
) {
  const shortcut: Shortcut = {
    id: "single-shortcut",
    keys,
    description: "Single shortcut",
    callback,
    preventDefault: options?.preventDefault,
    stopPropagation: options?.stopPropagation,
  }

  return useKeyboardShortcuts([shortcut])
}

// 优化点 6: 快捷键状态管理
export function useShortcutState() {
  const [isListening, setIsListening] = useState(true)
  const [lastTriggered, setLastTriggered] = useState<Date | null>(null)
  const [triggerCount, setTriggerCount] = useState(0)

  const trigger = useCallback(() => {
    setLastTriggered(new Date())
    setTriggerCount((prev) => prev + 1)
  }, [])

  return {
    isListening,
    setIsListening,
    lastTriggered,
    triggerCount,
    trigger,
  }
}

// 优化点 7: 快捷键帮助 Hook
export function useShortcutHelp() {
  const [showHelp, setShowHelp] = useState(false)

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev)
  }, [])

  return { showHelp, setShowHelp, toggleHelp }
}

// 优化点 8: 常用快捷键预设
export const commonShortcuts = {
  save: {
    keys: ["ctrl+s", "cmd+s"],
    description: "保存",
  },
  undo: {
    keys: ["ctrl+z", "cmd+z"],
    description: "撤销",
  },
  redo: {
    keys: ["ctrl+y", "ctrl+shift+z", "cmd+shift+z"],
    description: "重做",
  },
  copy: {
    keys: ["ctrl+c", "cmd+c"],
    description: "复制",
  },
  paste: {
    keys: ["ctrl+v", "cmd+v"],
    description: "粘贴",
  },
  cut: {
    keys: ["ctrl+x", "cmd+x"],
    description: "剪切",
  },
  find: {
    keys: ["ctrl+f", "cmd+f"],
    description: "搜索",
  },
  help: {
    keys: ["?", "ctrl+/", "cmd+/"],
    description: "帮助",
  },
  escape: {
    keys: "escape",
    description: "取消",
  },
  new: {
    keys: ["ctrl+n", "cmd+n"],
    description: "新建",
  },
}

// 优化点 9: 按键组合构建器
export function buildKeyCombination(
  key: string,
  options?: {
    ctrl?: boolean
    cmd?: boolean
    alt?: boolean
    shift?: boolean
  }
) {
  const parts: string[] = []
  if (options?.ctrl) parts.push("ctrl")
  if (options?.cmd) parts.push("cmd")
  if (options?.alt) parts.push("alt")
  if (options?.shift) parts.push("shift")
  parts.push(key.toLowerCase())
  return parts.join("+")
}

// 优化点 10: 快捷键验证
export function validateShortcut(keys: string | string[]) {
  const sequences = Array.isArray(keys) ? keys : [keys]
  const issues: string[] = []

  sequences.forEach((seq, idx) => {
    const parts = seq.split("+").map((p) => p.trim().toLowerCase())
    if (parts.length === 0) {
      issues.push(`序列 ${idx + 1}: 为空`)
    }
    const hasModifier = parts.some((p) =>
      ["ctrl", "cmd", "alt", "shift"].includes(p)
    )
    if (parts.length > 1 && !hasModifier) {
      issues.push(
        `序列 ${idx + 1}: 多键组合应该包含修饰键`
      )
    }
  })

  return { valid: issues.length === 0, issues }
}

// 快捷键格式化显示
export function formatShortcut(keys: string | string[]) {
  const sequences = Array.isArray(keys) ? keys : [keys]
  return sequences
    .map((seq) => {
      return seq
        .split("+")
        .map((key) => {
          const lower = key.trim().toLowerCase()
          if (lower === "ctrl") return "Ctrl"
          if (lower === "cmd") return "⌘"
          if (lower === "alt") return "Alt"
          if (lower === "shift") return "⇧"
          if (lower === "escape") return "Esc"
          return lower.charAt(0).toUpperCase() + lower.slice(1)
        })
        .join("+")
    })
    .join(" / ")
}
