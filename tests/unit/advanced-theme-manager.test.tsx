import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  themeManager,
  useTheme,
  useThemeColors,
  useThemeMode,
  useThemeCustomProperty
} from '@/utils/advanced-theme-manager'

describe('AdvancedThemeManager Tests', () => {
  beforeEach(() => {
    themeManager.setTheme('light')
  })

  describe('Theme Management', () => {
    it('should get current theme', () => {
      const theme = themeManager.getTheme()

      expect(theme).toBeDefined()
      expect(theme.name).toBe('light')
      expect(theme.mode).toBe('light')
    })

    it('should set theme', () => {
      act(() => {
        themeManager.setTheme('dark')
      })

      const theme = themeManager.getTheme()
      expect(theme.name).toBe('dark')
    })

    it('should toggle theme', () => {
      act(() => {
        themeManager.setTheme('light')
        themeManager.toggleTheme()
      })

      const theme = themeManager.getTheme()
      expect(theme.name).toBe('dark')
    })

    it('should register custom theme', () => {
      const customTheme = {
        name: 'custom',
        theme: {
          colors: {
            primary: '#ff0000'
          }
        }
      }

      act(() => {
        themeManager.registerTheme(customTheme)
        themeManager.setTheme('custom')
      })

      const theme = themeManager.getTheme()
      expect(theme.name).toBe('custom')
    })

    it('should get all theme names', () => {
      const names = themeManager.getThemeNames()

      expect(names).toContain('light')
      expect(names).toContain('dark')
    })
  })

  describe('Theme Export/Import', () => {
    it('should export theme', () => {
      const exported = themeManager.exportTheme()

      expect(exported).toContain('light')
      expect(exported).toContain('colors')
    })

    it('should import valid theme', () => {
      const customTheme = {
        name: 'imported',
        colors: {
          primary: '#00ff00',
          secondary: '#0000ff',
          accent: '#ffff00',
          background: '#ffffff',
          surface: '#f0f0f0',
          text: '#000000',
          textSecondary: '#333333',
          border: '#cccccc',
          error: '#ff0000',
          success: '#00ff00',
          warning: '#ffff00',
          info: '#0000ff'
        },
        spacing: {},
        typography: {
          fontFamily: 'sans-serif',
          fontSize: {},
          fontWeight: {},
          lineHeight: {}
        },
        shadows: {},
        borderRadius: {},
        mode: 'light' as const
      }

      const result = themeManager.importTheme(JSON.stringify(customTheme))

      expect(result).toBe(true)
    })

    it('should reject invalid theme import', () => {
      const invalid = JSON.stringify({ name: 'test' })
      const result = themeManager.importTheme(invalid)

      expect(result).toBe(false)
    })
  })

  describe('Theme Colors', () => {
    it('should provide color palette', () => {
      const palette = themeManager.getColorPalette('primary')

      expect(palette).toHaveLength(5)
      expect(palette[0]).toContain('rgba')
    })

    it('should calculate contrast ratio', () => {
      const ratio = themeManager.calculateContrast('#ffffff', '#000000')

      expect(ratio).toBeGreaterThan(20)
    })
  })

  describe('Theme Listeners', () => {
    it('should add and remove listener', () => {
      const listener = vi.fn()

      const remove = themeManager.addListener(listener)
      expect(typeof remove).toBe('function')

      act(() => {
        themeManager.setTheme('dark')
      })

      remove()
    })
  })

  describe('React Hooks', () => {
    it('should useTheme hook', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBeDefined()
      expect(typeof result.current.setTheme).toBe('function')
      expect(typeof result.current.toggleTheme).toBe('function')
    })

    it('should useThemeColors hook', () => {
      const { result } = renderHook(() => useThemeColors())

      expect(result.current).toHaveProperty('primary')
      expect(result.current).toHaveProperty('background')
    })

    it('should useThemeMode hook', () => {
      const { result } = renderHook(() => useThemeMode())

      expect(result.current).toMatch(/^(light|dark)$/)
    })
  })

  describe('Theme Transitions', () => {
    it('should create theme transition', () => {
      act(() => {
        themeManager.createThemeTransition('fade', '300ms', 'ease-in-out')
      })

      const transition = themeManager.getThemeTransition('fade')
      expect(transition).toBeDefined()
      expect(transition?.duration).toBe('300ms')
    })
  })
})
