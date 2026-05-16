import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundaryComponent } from '@/components/error-handling/error-boundary-component'

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error for boundary testing')
  }
  return <div>Content rendered successfully</div>
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>
}

describe('ErrorBoundaryComponent Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Error Catching', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <TestWrapper>
          <ErrorBoundaryComponent>
            <ThrowError shouldThrow={true} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Error ID: err_/)).toBeInTheDocument()
    })

    it('should render children when no error occurs', () => {
      render(
        <TestWrapper>
          <ErrorBoundaryComponent>
            <ThrowError shouldThrow={false} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      expect(screen.getByText('Content rendered successfully')).toBeInTheDocument()
    })
  })

  describe('Error Details Display', () => {
    it('should show error ID in fallback', () => {
      render(
        <TestWrapper>
          <ErrorBoundaryComponent showErrorDetails={true}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      const errorIdText = screen.getByText(/Error ID: err_/).textContent
      expect(errorIdText).toMatch(/err_\d+_[a-z0-9]+/)
    })
  })

  describe('Error Logging', () => {
    it('should generate unique error IDs', () => {
      render(
        <TestWrapper>
          <ErrorBoundaryComponent>
            <ThrowError shouldThrow={true} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      const errorIdElement = screen.getByText(/Error ID: err_/)
      const errorId = errorIdElement.textContent?.replace('Error ID: ', '')

      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/)
    })

    it('should attempt to store error without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <ErrorBoundaryComponent>
            <ThrowError shouldThrow={true} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <TestWrapper>
          <ErrorBoundaryComponent fallback={customFallback}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundaryComponent>
        </TestWrapper>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    })
  })
})
