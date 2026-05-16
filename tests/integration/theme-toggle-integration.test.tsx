import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApplicationThemeToggle } from '@/hooks/use-application-theme-toggle'

describe('Theme Toggle Hook Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Theme Initialization', () => {
    it('should initialize theme from localStorage or default', () => {
      const { result } = renderHook(() => useApplicationThemeToggle())
      
      expect(['dark', 'light']).toContain(result.current.theme)
    })

    it('should initialize with saved theme from localStorage', () => {
      localStorage.setItem('theme', 'light')
      
      const { result } = renderHook(() => useApplicationThemeToggle())
      
      expect(result.current.theme).toBe('light')
    })
  })

  describe('Theme Toggle Functionality', () => {
    it('should toggle theme state correctly', async () => {
      const { result } = renderHook(() => useApplicationThemeToggle())
      
      const initialTheme = result.current.theme
      
      act(() => {
        result.current.toggleApplicationTheme()
      })
      
      expect(result.current.theme).not.toBe(initialTheme)
    })

    it('should toggle from light to dark theme', async () => {
      localStorage.setItem('theme', 'light')
      
      const { result } = renderHook(() => useApplicationThemeToggle())
      
      expect(result.current.theme).toBe('light')
      
      act(() => {
        result.current.toggleApplicationTheme()
      })
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDarkModeActive).toBe(true)
    })
  })

  describe('Theme Persistence', () => {
    it('should save theme to localStorage on toggle', async () => {
      const { result } = renderHook(() => useApplicationThemeToggle())
      
      act(() => {
        result.current.toggleApplicationTheme()
      })
      
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })
})
