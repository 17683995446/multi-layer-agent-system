import { z } from "zod"
import { useForm, useFieldArray, Controller, FieldValues, DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useCallback, useMemo } from "react"

// ========== TOP 11: 高级表单验证系统 (10个优化点) ==========

// 优化点 1: 基础 Zod Schema 验证
export const taskFormSchema = z.object({
  id: z.string().min(1, "ID不能为空"),
  name: z.string().min(1, "任务名称不能为空").max(100, "任务名称不能超过100字符"),
  description: z.string().max(500, "描述不能超过500字符").optional(),
  status: z.enum(["pending", "running", "completed", "failed"], {
    required_error: "请选择任务状态",
  }),
  priority: z.number().min(1, "优先级最低为1").max(5, "优先级最高为5").optional(),
  tags: z.array(z.string().min(1, "标签不能为空")).default([]),
  dueDate: z.coerce.date().optional(),
  metadata: z.record(z.any()).default({}),
})

export const userFormSchema = z.object({
  id: z.string().uuid("无效的用户ID"),
  email: z.string().email("无效的邮箱格式"),
  name: z.string().min(2, "用户名至少2个字符").max(50, "用户名不能超过50字符"),
  role: z.enum(["admin", "user", "guest"], { required_error: "请选择用户角色" }),
  age: z.number().min(18, "年龄必须大于等于18").max(120, "年龄不能超过120").optional(),
  phone: z.string().regex(/^\d{11}$/, "手机号必须是11位数字").optional(),
})

export const settingsFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], { required_error: "请选择主题" }),
  language: z.enum(["en", "zh"], { required_error: "请选择语言" }),
  notifications: z.boolean(),
  autoSave: z.boolean(),
  compactMode: z.boolean(),
})

// 优化点 2: 验证规则组合
export const createRequiredStringSchema = (
  fieldName: string,
  minLength = 1,
  maxLength = 100
) =>
  z
    .string()
    .min(minLength, `${fieldName}至少${minLength}个字符`)
    .max(maxLength, `${fieldName}不能超过${maxLength}字符`)

export const createNumberRangeSchema = (
  fieldName: string,
  min = 1,
  max = 100
) =>
  z
    .number()
    .min(min, `${fieldName}最低为${min}`)
    .max(max, `${fieldName}最高为${max}`)

// 优化点 3: 条件验证
export const conditionalTaskSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["pending", "running", "completed", "failed"]),
  dueDate: z.coerce.date().optional(),
})
.refine((data) => {
  // 如果任务状态是 completed，必须有截止日期
  if (data.status === "completed") {
    return data.dueDate !== undefined
  }
  return true
}, {
  message: "已完成的任务必须有截止日期",
  path: ["dueDate"],
})

// 优化点 4: 异步验证
export const createAsyncEmailSchema = (
  checkEmailExists: (email: string) => Promise<boolean>
) =>
  z.object({
    email: z
      .string()
      .email("无效的邮箱格式")
      .refine(async (email) => {
        const exists = await checkEmailExists(email)
        return !exists
      }, "该邮箱已被使用"),
  })

// 优化点 5: 数组字段验证
export const taskTagsSchema = z.object({
  tags: z
    .array(
      z.object({
        name: z.string().min(1, "标签名不能为空"),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "无效的颜色格式"),
      })
    )
    .min(1, "至少需要一个标签")
    .max(10, "标签最多10个"),
})

// 优化点 6: 类型安全的表单 Hook
type TaskFormValues = z.infer<typeof taskFormSchema>
type UserFormValues = z.infer<typeof userFormSchema>
type SettingsFormValues = z.infer<typeof settingsFormSchema>

export function useTaskForm(defaultValues?: Partial<TaskFormValues>) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      status: "pending",
      priority: 3,
      tags: [],
      metadata: {},
      ...defaultValues,
    },
    mode: "onChange", // 优化点 7: 实时验证触发时机
  })

  const tagsArray = useFieldArray({
    control,
    name: "tags",
  })

  return {
    control,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    reset,
    setValue,
    watch,
    tagsArray,
  }
}

export function useUserForm(defaultValues?: Partial<UserFormValues>) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: "",
      email: "",
      name: "",
      role: "user",
      age: 25,
      phone: "",
      ...defaultValues,
    },
    mode: "onChange",
  })

  return {
    control,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    reset,
    setValue,
    watch,
  }
}

// 优化点 8: 验证触发配置
export function useCustomForm<
  TSchema extends z.ZodType<any, any>,
  TValues extends z.infer<TSchema> = z.infer<TSchema>
>(
  schema: TSchema,
  defaultValues: DefaultValues<TValues>,
  options?: {
    mode?: "onSubmit" | "onBlur" | "onChange" | "all" | "onTouched"
  }
) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid, touchedFields },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: options?.mode || "onChange",
  })

  // 优化点 9: 验证性能优化
  const validateField = useCallback((name: keyof TValues, value: any) => {
    try {
      const result = schema.shape[name as keyof typeof schema.shape].safeParse(value)
      return { success: result.success, error: result.success ? null : (result as any).error.message }
    } catch {
      return { success: false, error: "验证失败" }
    }
  }, [schema])

  // 优化点 10: 表单状态持久化
  const saveFormState = useCallback(() => {
    try {
      const values = getValues()
      localStorage.setItem("form-state", JSON.stringify(values))
      return true
    } catch {
      return false
    }
  }, [getValues])

  const loadFormState = useCallback(() => {
    try {
      const saved = localStorage.getItem("form-state")
      if (saved) {
        const parsed = JSON.parse(saved)
        reset(parsed as DefaultValues<TValues>)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [reset])

  return {
    control,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    touchedFields,
    reset,
    setValue,
    watch,
    getValues,
    validateField,
    saveFormState,
    loadFormState,
  }
}

// 辅助函数: 验证反馈
export function getFieldErrorStyle(errors: any, name: string) {
  return errors[name] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
}

export function formatValidationErrors<T extends FieldValues>(errors: any) {
  const errorMessages: string[] = []
  Object.keys(errors).forEach((key) => {
    if (errors[key]?.message) {
      errorMessages.push(`${key}: ${errors[key].message}`)
    }
  })
  return errorMessages
}
