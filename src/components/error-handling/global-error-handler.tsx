import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ErrorLog {
  errorId: string
  message: string
  stack?: string
  timestamp: string
  url: string
}

interface GlobalErrorHandlerContextType {
  errors: ErrorLog[]
  addError: (error: Error) => void
  clearErrors: () => void
  errorCount: number
}

const GlobalErrorHandlerContext = createContext<GlobalErrorHandlerContextType | undefined>(undefined)

export function GlobalErrorHandlerProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorLog[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('error_logs')
      if (stored) {
        setErrors(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load error logs:', error)
    }
  }, [])

  const addError = (error: Error) => {
    const errorLog: ErrorLog = {
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    setErrors(prev => {
      const updated = [errorLog, ...prev].slice(0, 50)
      localStorage.setItem('error_logs', JSON.stringify(updated))
      return updated
    })
  }

  const clearErrors = () => {
    setErrors([])
    localStorage.removeItem('error_logs')
  }

  return (
    <GlobalErrorHandlerContext.Provider
      value={{
        errors,
        addError,
        clearErrors,
        errorCount: errors.length
      }}
    >
      {children}
    </GlobalErrorHandlerContext.Provider>
  )
}

export function useGlobalErrorHandler() {
  const context = useContext(GlobalErrorHandlerContext)
  if (!context) {
    throw new Error('useGlobalErrorHandler must be used within GlobalErrorHandlerProvider')
  }
  return context
}

export function setupGlobalErrorHandlers() {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('🔴 Global error:', { message, source, lineno, colno, error })
    return false
  }

  window.onunhandledrejection = (event) => {
    console.error('🔴 Unhandled promise rejection:', event.reason)
  }
}
