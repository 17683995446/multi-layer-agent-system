import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  taskFormSchema,
  userFormSchema,
  settingsFormSchema,
  conditionalTaskSchema,
  useTaskForm,
  useUserForm,
  useCustomForm,
  createRequiredStringSchema,
  createNumberRangeSchema,
} from "@/utils/advanced-form-validation"

describe("Top 11: 高级表单验证系统 (10个优化点)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("优化点 1: 基础 Zod Schema 验证", () => {
    it("应该验证有效任务表单", () => {
      const validTask = {
        id: "task-123",
        name: "测试任务",
        description: "这是一个测试任务",
        status: "pending" as const,
        priority: 3,
        tags: ["work", "urgent"],
        metadata: { createdBy: "user-1" },
      }
      const result = taskFormSchema.safeParse(validTask)
      expect(result.success).toBe(true)
    })

    it("应该拒绝无效任务名称", () => {
      const invalidTask = { id: "task-123", name: "", status: "pending" as const }
      const result = taskFormSchema.safeParse(invalidTask)
      expect(result.success).toBe(false)
    })
  })

  describe("优化点 2: 验证规则组合", () => {
    it("应该创建必填字符串验证器", () => {
      const schema = createRequiredStringSchema("用户名", 2, 20)
      expect(schema.safeParse("张").success).toBe(false)
      expect(schema.safeParse("张三").success).toBe(true)
    })

    it("应该创建范围数字验证器", () => {
      const schema = createNumberRangeSchema("年龄", 18, 100)
      expect(schema.safeParse(17).success).toBe(false)
      expect(schema.safeParse(30).success).toBe(true)
    })
  })

  describe("优化点 3: 条件验证", () => {
    it("已完成任务必须有截止日期", () => {
      const withoutDueDate = {
        name: "测试任务",
        status: "completed" as const,
      }
      const result1 = conditionalTaskSchema.safeParse(withoutDueDate)
      expect(result1.success).toBe(false)

      const withDueDate = {
        name: "测试任务",
        status: "completed" as const,
        dueDate: new Date("2026-12-31"),
      }
      const result2 = conditionalTaskSchema.safeParse(withDueDate)
      expect(result2.success).toBe(true)
    })
  })

  describe("优化点 4-6: 表单 Hooks", () => {
    it("useTaskForm 应该正常工作", () => {
      const { result } = renderHook(() => useTaskForm())
      expect(result.current.errors).toBeDefined()
      expect(result.current.handleSubmit).toBeDefined()
    })

    it("useUserForm 应该初始化", () => {
      const { result } = renderHook(() => useUserForm())
      expect(result.current.errors).toBeDefined()
      expect(result.current.register).toBeDefined()
    })
  })

  describe("优化点 7-9: 高级表单功能", () => {
    it("useCustomForm 应该验证并返回状态", () => {
      const { result } = renderHook(() =>
        useCustomForm(taskFormSchema, {
          id: "",
          name: "",
          status: "pending",
          tags: [],
          metadata: {},
        })
      )
      expect(result.current.errors).toBeDefined()
      expect(result.current.validateField).toBeDefined()
    })

    it("应该验证字段值", () => {
      const { result } = renderHook(() =>
        useCustomForm(taskFormSchema, {
          id: "",
          name: "",
          status: "pending",
          tags: [],
          metadata: {},
        })
      )
      const validation = result.current.validateField("name", "")
      expect(validation.success).toBe(false)
    })
  })

  describe("优化点 10: 表单持久化", () => {
    it("应该保存和加载表单状态", () => {
      localStorage.clear()
      const { result } = renderHook(() =>
        useCustomForm(settingsFormSchema, {
          theme: "light",
          language: "zh",
          notifications: true,
          autoSave: true,
          compactMode: false,
        })
      )
      act(() => {
        result.current.setValue("theme", "dark")
        const saved = result.current.saveFormState()
        expect(saved).toBe(true)
      })
    })
  })

  describe("系统 Schema 验证", () => {
    it("userFormSchema 应该验证角色", () => {
      const validUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        name: "测试用户",
        role: "admin" as const,
      }
      expect(userFormSchema.safeParse(validUser).success).toBe(true)
    })

    it("settingsFormSchema 应该验证主题", () => {
      const validSettings = {
        theme: "dark" as const,
        language: "zh" as const,
        notifications: true,
        autoSave: false,
        compactMode: true,
      }
      expect(settingsFormSchema.safeParse(validSettings).success).toBe(true)
    })
  })
})
