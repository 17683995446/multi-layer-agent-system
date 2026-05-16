import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ErrorBoundaryComponentProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
}

interface ErrorBoundaryComponentState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class ErrorBoundaryComponent extends Component<
  ErrorBoundaryComponentProps,
  ErrorBoundaryComponentState
> {
  constructor(props: ErrorBoundaryComponentProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryComponentState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.logErrorToService(error, errorInfo)
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    const errorLog = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('🔴 Error caught by ErrorBoundary:', errorLog)

    try {
      const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]')
      errorLogs.unshift(errorLog)
      if (errorLogs.length > 50) {
        errorLogs.pop()
      }
      localStorage.setItem('error_logs', JSON.stringify(errorLogs))
    } catch (storageError) {
      console.error('Failed to save error log:', storageError)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallbackDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.handleReset}
          showDetails={this.props.showErrorDetails ?? false}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackDisplayProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  onReset: () => void
  showDetails: boolean
}

function ErrorFallbackDisplay({
  error,
  errorInfo,
  errorId,
  onReset,
  showDetails
}: ErrorFallbackDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center p-8"
    >
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-red-500/30 p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
            >
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-400 mb-2">
              We're sorry, but something unexpected happened.
            </p>
            
            <div className="inline-block px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
              <span className="text-xs text-slate-500 font-mono">
                Error ID: {errorId}
              </span>
            </div>
          </div>

          {showDetails && error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20"
            >
              <h3 className="text-sm font-semibold text-red-300 mb-2">
                Error Details:
              </h3>
              <pre className="text-xs text-red-200/80 font-mono overflow-x-auto max-h-40">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </motion.div>
          )}

          {showDetails && errorInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-2">
                Component Stack:
              </h3>
              <pre className="text-xs text-slate-400 font-mono overflow-x-auto max-h-40">
                {errorInfo.componentStack}
              </pre>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </motion.button>

            <Link
              to="/"
              className="flex-1 px-6 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              If this problem persists, please contact support with the error ID above.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export function withErrorBoundary<Props extends object>(
  WrappedComponent: React.ComponentType<Props>,
  errorBoundaryProps?: ErrorBoundaryComponentProps
): React.ComponentType<Props> {
  return function WithErrorBoundaryComponent(props: Props) {
    return (
      <ErrorBoundaryComponent {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundaryComponent>
    )
  }
}
