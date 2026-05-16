import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  success: string
  warning: string
  info: string
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  xxl: string
}

export interface ThemeTypography {
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    xxl: string
  }
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
}

export interface ThemeShadow {
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeBorderRadius {
  sm: string
  md: string
  lg: string
  xl: string
  full: string
}

export interface Theme {
  name: string
  colors: ThemeColors
  spacing: ThemeSpacing
  typography: ThemeTypography
  shadows: ThemeShadow
  borderRadius: ThemeBorderRadius
  mode: 'light' | 'dark' | 'system'
}

export interface ThemePreset {
  name: string
  theme: Partial<Theme>
}

export interface ThemeConfig {
  defaultTheme?: string
  persist?: boolean
  storageKey?: string
  enableSystemTheme?: boolean
  themes?: ThemePreset[]
  customThemes?: ThemePreset[]
}

export interface ThemeTransition {
  duration: string
  easing: string
}

const lightTheme: Theme = {
  name: 'light',
  mode: 'light',
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#28a745',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  }
}

const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',
  mode: 'dark',
  colors: {
    primary: '#4dabf7',
    secondary: '#868e96',
    accent: '#51cf66',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#f8f9fa',
    textSecondary: '#adb5bd',
    border: '#495057',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#fcc419',
    info: '#74c0fc'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)'
  }
}

const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme
}

class AdvancedThemeManager {
  private static instance: AdvancedThemeManager
  private currentTheme: Theme
  private listeners: Set<(theme: Theme) => void> = new Set()
  private config: ThemeConfig
  private transitions: Map<string, ThemeTransition> = new Map()

  private constructor() {
    this.config = {
      persist: true,
      storageKey: 'app-theme',
      enableSystemTheme: true,
      themes: []
    }
    this.currentTheme = lightTheme
    this.loadPersistedTheme()
    this.setupSystemThemeListener()
  }

  static getInstance(): AdvancedThemeManager {
    if (!AdvancedThemeManager.instance) {
      AdvancedThemeManager.instance = new AdvancedThemeManager()
    }
    return AdvancedThemeManager.instance
  }

  configure(config: ThemeConfig): void {
    this.config = { ...this.config, ...config }
    if (config.persist !== undefined) {
      this.config.persist = config.persist
    }
    if (config.themes) {
      config.themes.forEach(preset => {
        themes[preset.name] = { ...lightTheme, ...preset.theme, name: preset.name }
      })
    }
  }

  getTheme(): Theme {
    return this.currentTheme
  }

  setTheme(themeName: string): void {
    const theme = themes[themeName]
    if (theme) {
      this.currentTheme = theme
      this.applyTheme(theme)
      this.notifyListeners()
      this.persistTheme(themeName)
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.mode === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }

  registerTheme(preset: ThemePreset): void {
    themes[preset.name] = { ...lightTheme, ...preset.theme, name: preset.name }
  }

  getThemeNames(): string[] {
    return Object.keys(themes)
  }

  addListener(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme))
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })

    root.style.setProperty('--font-family', theme.typography.fontFamily)
    root.style.setProperty('--shadow-sm', theme.shadows.sm)
    root.style.setProperty('--shadow-md', theme.shadows.md)
    root.style.setProperty('--shadow-lg', theme.shadows.lg)
    root.style.setProperty('--shadow-xl', theme.shadows.xl)

    root.setAttribute('data-theme', theme.name)
  }

  private persistTheme(themeName: string): void {
    if (this.config.persist) {
      try {
        localStorage.setItem(this.config.storageKey!, themeName)
      } catch (error) {
        console.error('Failed to persist theme:', error)
      }
    }
  }

  private loadPersistedTheme(): void {
    if (this.config.persist) {
      try {
        const saved = localStorage.getItem(this.config.storageKey!)
        if (saved && themes[saved]) {
          this.currentTheme = themes[saved]
          this.applyTheme(this.currentTheme)
        }
      } catch (error) {
        console.error('Failed to load persisted theme:', error)
      }
    }
  }

  private setupSystemThemeListener(): void {
    if (!this.config.enableSystemTheme) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const systemTheme = e.matches ? 'dark' : 'light'
      if (this.currentTheme.mode === 'system') {
        const theme = themes[systemTheme]
        this.currentTheme = theme
        this.applyTheme(theme)
        this.notifyListeners()
      }
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)
  }

  createThemeTransition(name: string, duration: string, easing: string): void {
    this.transitions.set(name, { duration, easing })
  }

  getThemeTransition(name: string): ThemeTransition | undefined {
    return this.transitions.get(name)
  }

  exportTheme(): string {
    return JSON.stringify(this.currentTheme, null, 2)
  }

  importTheme(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      if (imported.name && imported.colors) {
        themes[imported.name] = imported
        return true
      }
      return false
    } catch {
      return false
    }
  }

  getColorPalette(type: 'primary' | 'secondary' | 'accent'): string[] {
    const base = this.currentTheme.colors[type]
    return [
      this.adjustColorOpacity(base, 0.9),
      base,
      this.adjustColorOpacity(base, 0.8),
      this.adjustColorOpacity(base, 0.7),
      this.adjustColorOpacity(base, 0.6)
    ]
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  calculateContrast(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16) / 255
      const g = parseInt(hex.substring(2, 4), 16) / 255
      const b = parseInt(hex.substring(4, 6), 16) / 255

      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }

    const L1 = getLuminance(foreground)
    const L2 = getLuminance(background)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  ensureContrast(color1: string, color2: string, minRatio: number = 4.5): string {
    const ratio = this.calculateContrast(color1, color2)
    if (ratio >= minRatio) {
      return color1
    }

    if (this.currentTheme.mode === 'dark') {
      return this.adjustColorOpacity('#ffffff', 0.9)
    }
    return this.adjustColorOpacity('#000000', 0.9)
  }
}

export const themeManager = AdvancedThemeManager.getInstance()

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (name: string) => void
  toggleTheme: () => void
}>({
  theme: lightTheme,
  setTheme: () => {},
  toggleTheme: () => {}
})

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    return {
      theme: themeManager.getTheme(),
      setTheme: (name: string) => themeManager.setTheme(name),
      toggleTheme: () => themeManager.toggleTheme()
    }
  }

  return context
}

export function useThemeColors() {
  const { theme } = useTheme()
  return theme.colors
}

export function useThemeSpacing() {
  const { theme } = useTheme()
  return theme.spacing
}

export function useThemeTypography() {
  const { theme } = useTheme()
  return theme.typography
}

export function useThemeMode() {
  const { theme } = useTheme()
  return theme.mode
}

export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}

export function useThemeTransition(name: string) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const startTransition = useCallback(() => {
    setIsTransitioning(true)
  }, [])

  const endTransition = useCallback(() => {
    setIsTransitioning(false)
  }, [])

  useEffect(() => {
    const transition = themeManager.getThemeTransition(name)
    if (transition) {
      setTimeout(endTransition, parseInt(transition.duration))
    }
  }, [name, endTransition])

  return { isTransitioning, startTransition, endTransition }
}

export function useThemeCustomProperty(property: string) {
  const { theme } = useTheme()

  return useMemo(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${property}`)
      .trim()
    return value || undefined
  }, [property, theme])
}

export function useAccentColor() {
  const { theme } = useTheme()
  return theme.colors.primary
}

export function useThemeListener(callback: (theme: Theme) => void) {
  useEffect(() => {
    const remove = themeManager.addListener(callback)
    return remove
  }, [callback])
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(themeManager.getTheme())

  useEffect(() => {
    return themeManager.addListener(setThemeState)
  }, [])

  const setTheme = useCallback((name: string) => {
    themeManager.setTheme(name)
  }, [])

  const toggleTheme = useCallback(() => {
    themeManager.toggleTheme()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function createCustomTheme(name: string, colors: Partial<ThemeColors>): Theme {
  return {
    ...lightTheme,
    name,
    colors: {
      ...lightTheme.colors,
      ...colors
    }
  }
}

export function useThemeExport() {
  return useCallback(() => {
    return themeManager.exportTheme()
  }, [])
}

export function useThemeImport() {
  return useCallback((data: string) => {
    return themeManager.importTheme(data)
  }, [])
}
