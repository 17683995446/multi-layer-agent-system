import { createBrowserRouter, RouterProvider, useNavigate, useLocation, useParams, useSearchParams, Link, Outlet } from "react-router-dom"
import { useState, useCallback, useMemo, useEffect, Suspense } from "react"

// ========== TOP 16: 路由导航增强系统 (10个优化点) ==========

// 路由配置类型
interface RouteConfig {
  path: string
  element: React.ReactNode
  loader?: () => Promise<any>
  children?: RouteConfig[]
  meta?: {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
  }
}

// 面包屑类型
interface Breadcrumb {
  label: string
  path: string
}

// 优化点 1: 动态路由配置
export function createAppRouter(routes: RouteConfig[]) {
  return createBrowserRouter(routes.map(normalizeRoute))
}

function normalizeRoute(route: RouteConfig): any {
  const normalized: any = {
    path: route.path,
    element: route.element,
  }

  if (route.loader) {
    normalized.loader = route.loader
  }

  if (route.children) {
    normalized.children = route.children.map(normalizeRoute)
  }

  return normalized
}

// 优化点 2: 路由守卫
export function withRouteGuard(
  element: React.ReactNode,
  options?: {
    requiresAuth?: boolean
    roles?: string[]
    onUnauthorized?: () => void
  }
) {
  return (
    <RouteGuard
      requiresAuth={options?.requiresAuth}
      roles={options?.roles}
      onUnauthorized={options?.onUnauthorized}
    >
      {element}
    </RouteGuard>
  )
}

function RouteGuard({
  children,
  requiresAuth,
  roles,
  onUnauthorized,
}: {
  children: React.ReactNode
  requiresAuth?: boolean
  roles?: string[]
  onUnauthorized?: () => void
}) {
  const navigate = useNavigate()
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    if (requiresAuth) {
      const hasAuth = checkAuthentication()
      if (!hasAuth) {
        navigate("/login")
        return
      }
    }

    if (roles && roles.length > 0) {
      const hasPermission = checkPermissions(roles)
      if (!hasPermission) {
        setIsAuthorized(false)
        onUnauthorized?.()
      }
    }
  }, [requiresAuth, roles, navigate, onUnauthorized])

  if (!isAuthorized) {
    return <div>未授权访问</div>
  }

  return <>{children}</>
}

function checkAuthentication(): boolean {
  return !!localStorage.getItem("auth-token")
}

function checkPermissions(requiredRoles: string[]): boolean {
  const userRoles = JSON.parse(localStorage.getItem("user-roles") || "[]")
  return requiredRoles.some((role) => userRoles.includes(role))
}

// 优化点 3: 嵌套路由布局
export function createLayoutWithNestedRoutes(
  layout: React.ReactNode,
  routes: RouteConfig[]
) {
  return {
    path: "/",
    element: <LayoutWrapper>{layout}</LayoutWrapper>,
    children: routes.map(normalizeRoute),
  }
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-wrapper">
      <header className="layout-header">应用头部</header>
      <main className="layout-main">
        <Suspense fallback={<div>加载中...</div>}>{children}</Suspense>
      </main>
      <footer className="layout-footer">应用底部</footer>
    </div>
  )
}

// 优化点 4: 路由过渡动画
export function RouteTransition({
  children,
  animation = "fade",
}: {
  children: React.ReactNode
  animation?: "fade" | "slide" | "scale"
}) {
  const [displayLocation, setDisplayLocation] = useState(useLocation().pathname)
  const [transitionStage, setTransitionStage] = useState("enter")

  useEffect(() => {
    setTransitionStage("exit")
    const timer = setTimeout(() => {
      setDisplayLocation(useLocation().pathname)
      setTransitionStage("enter")
    }, 300)
    return () => clearTimeout(timer)
  }, [useLocation().pathname])

  const animationStyle = useMemo(() => {
    switch (animation) {
      case "slide":
        return transitionStage === "exit"
          ? { opacity: 0, transform: "translateX(-20px)" }
          : { opacity: 1, transform: "translateX(0)" }
      case "scale":
        return transitionStage === "exit"
          ? { opacity: 0, transform: "scale(0.95)" }
          : { opacity: 1, transform: "scale(1)" }
      default:
        return transitionStage === "exit"
          ? { opacity: 0 }
          : { opacity: 1 }
    }
  }, [animation, transitionStage])

  return (
    <div
      style={{
        ...animationStyle,
        transition: "all 0.3s ease-in-out",
      }}
    >
      {children}
    </div>
  )
}

// 优化点 5: 路由懒加载
export function lazyRouteComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) {
  const LazyComponent = () => {
    const Component = require(importFn)
    return <Component.default />
  }

  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <LazyComponent />
    </Suspense>
  )
}

function RouteLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

// 优化点 6: 路由参数验证
export function useValidatedParams<T extends Record<string, string>>(
  schema: z.ZodSchema<T>
) {
  const params = useParams()
  const [validatedParams, setValidatedParams] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const result = schema.parse(params)
      setValidatedParams(result)
      setError(null)
    } catch (err) {
      setError("无效的路由参数")
      setValidatedParams(null)
    }
  }, [params, schema])

  return { params: validatedParams, error }
}

import { z } from "zod"

// 优化点 7: 查询参数管理
export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const getParam = useCallback(
    (key: string, defaultValue: string = ""): string => {
      return searchParams.get(key) || defaultValue
    },
    [searchParams]
  )

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set(key, value)
        return newParams
      })
    },
    [setSearchParams]
  )

  const removeParam = useCallback(
    (key: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete(key)
        return newParams
      })
    },
    [setSearchParams]
  )

  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  return {
    getParam,
    setParam,
    removeParam,
    getAllParams,
    setSearchParams,
  }
}

// 优化点 8: 路由历史管理
export function useRouteHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [history, setHistory] = useState<{ path: string; timestamp: number }[]>([
    { path: location.pathname, timestamp: Date.now() },
  ])

  const push = useCallback(
    (path: string, replace = false) => {
      if (replace) {
        navigate(path, { replace: true })
      } else {
        navigate(path)
        setHistory((prev) => [...prev, { path, timestamp: Date.now() }])
      }
    },
    [navigate]
  )

  const canGoBack = useMemo(() => history.length > 1, [history])

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newHistory = [...history]
      newHistory.pop()
      const previousPath = newHistory[newHistory.length - 1]
      navigate(previousPath.path, { replace: true })
      setHistory(newHistory)
    }
  }, [canGoBack, history, navigate])

  const clearHistory = useCallback(() => {
    setHistory([{ path: location.pathname, timestamp: Date.now() }])
  }, [location.pathname])

  return {
    push,
    canGoBack,
    goBack,
    clearHistory,
    historyLength: history.length,
  }
}

// 优化点 9: 面包屑导航
export function useBreadcrumbs() {
  const location = useLocation()
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])

  useEffect(() => {
    const generateBreadcrumbs = () => {
      const paths = location.pathname.split("/").filter((p) => p !== "")
      const crumbs: Breadcrumb[] = [{ label: "首页", path: "/" }]

      let currentPath = ""
      paths.forEach((path) => {
        currentPath += `/${path}`
        crumbs.push({
          label: formatBreadcrumbLabel(path),
          path: currentPath,
        })
      })

      return crumbs
    }

    setBreadcrumbs(generateBreadcrumbs())
  }, [location.pathname])

  const formatBreadcrumbLabel = (path: string): string => {
    return path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return breadcrumbs
}

export function BreadcrumbNav() {
  const breadcrumbs = useBreadcrumbs()

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && <span className="mx-2 text-gray-400">/</span>}
          <Link
            to={crumb.path}
            className={
              index === breadcrumbs.length - 1
                ? "text-gray-900 font-medium"
                : "text-blue-600 hover:underline"
            }
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}

// 优化点 10: 路由缓存
export function useRouteCache(maxSize: number = 10) {
  const [cache, setCache] = useState<Map<string, any>>(new Map())

  const set = useCallback(
    (path: string, data: any) => {
      setCache((prev) => {
        const newCache = new Map(prev)
        if (newCache.size >= maxSize) {
          const firstKey = newCache.keys().next().value
          newCache.delete(firstKey)
        }
        newCache.set(path, {
          data,
          timestamp: Date.now(),
        })
        return newCache
      })
    },
    [maxSize]
  )

  const get = useCallback(
    (path: string, maxAge?: number): any | null => {
      const cached = cache.get(path)
      if (!cached) return null

      if (maxAge && Date.now() - cached.timestamp > maxAge) {
        return null
      }

      return cached.data
    },
    [cache]
  )

  const invalidate = useCallback((path?: string) => {
    if (path) {
      setCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(path)
        return newCache
      })
    } else {
      setCache(new Map())
    }
  }, [])

  return { set, get, invalidate, cacheSize: cache.size }
}

// 路由工具函数
export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (options?.replace) {
    window.history.replaceState(null, "", path)
  } else {
    window.history.pushState(null, "", path)
  }
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export function getCurrentRoute(): string {
  return window.location.pathname
}

export function isRouteActive(path: string, exact: boolean = false): boolean {
  const currentPath = getCurrentRoute()
  if (exact) {
    return currentPath === path
  }
  return currentPath.startsWith(path)
}
