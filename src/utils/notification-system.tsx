export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
  duration?: number
  actions?: Array<{
    label: string
    onClick: () => void
  }>
}

export interface NotificationOptions {
  type?: Notification['type']
  title?: string
  persistent?: boolean
  duration?: number
  actions?: Notification['actions']
}

class NotificationSystem {
  private static instance: NotificationSystem
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private maxNotifications = 50

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  notify(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type || 'info',
      title: options.title || this.getDefaultTitle(options.type || 'info'),
      message,
      timestamp: new Date(),
      read: false,
      persistent: options.persistent,
      duration: options.duration || (options.persistent ? undefined : 5000),
      actions: options.actions
    }

    this.notifications.unshift(notification)
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    this.notifyListeners()

    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.dismiss(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  private getDefaultTitle(type: Notification['type']): string {
    const titles = {
      info: 'Information',
      success: 'Success',
      warning: 'Warning',
      error: 'Error'
    }
    return titles[type]
  }

  success(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify(message, { ...options, type: 'success' })
  }

  error(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify(message, { ...options, type: 'error', duration: 8000 })
  }

  warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify(message, { ...options, type: 'warning' })
  }

  info(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify(message, { ...options, type: 'info' })
  }

  dismiss(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      this.notifications.splice(index, 1)
      this.notifyListeners()
      return true
    }
    return false
  }

  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.notifyListeners()
      return true
    }
    return false
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => {
      n.read = true
    })
    this.notifyListeners()
  }

  clear(): void {
    this.notifications = []
    this.notifyListeners()
  }

  getAll(): Notification[] {
    return [...this.notifications]
  }

  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read)
  }

  getByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type)
  }

  getCount(): { total: number; unread: number } {
    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length
    }
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    const notifications = this.getAll()
    this.listeners.forEach(listener => {
      listener(notifications)
    })
  }
}

export const notificationSystem = NotificationSystem.getInstance()

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe(setNotifications)
    setNotifications(notificationSystem.getAll())
    return unsubscribe
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    notify: (message: string, options?: NotificationOptions) =>
      notificationSystem.notify(message, options),
    success: (message: string, options?: Partial<NotificationOptions>) =>
      notificationSystem.success(message, options),
    error: (message: string, options?: Partial<NotificationOptions>) =>
      notificationSystem.error(message, options),
    warning: (message: string, options?: Partial<NotificationOptions>) =>
      notificationSystem.warning(message, options),
    info: (message: string, options?: Partial<NotificationOptions>) =>
      notificationSystem.info(message, options),
    dismiss: (id: string) => notificationSystem.dismiss(id),
    markAsRead: (id: string) => notificationSystem.markAsRead(id),
    markAllAsRead: () => notificationSystem.markAllAsRead(),
    clear: () => notificationSystem.clear()
  }
}

import { useState, useEffect } from 'react'
