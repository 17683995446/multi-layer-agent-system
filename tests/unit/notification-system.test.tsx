import { describe, it, expect, beforeEach } from 'vitest'
import { notificationSystem, Notification } from '@/utils/notification-system'

describe('NotificationSystem Tests', () => {
  beforeEach(() => {
    notificationSystem.clear()
  })

  describe('Basic Notifications', () => {
    it('should create info notification', () => {
      const id = notificationSystem.info('Test message')
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should create success notification', () => {
      const id = notificationSystem.success('Success message')
      expect(id).toBeDefined()
    })

    it('should create error notification', () => {
      const id = notificationSystem.error('Error message')
      expect(id).toBeDefined()
    })

    it('should create warning notification', () => {
      const id = notificationSystem.warning('Warning message')
      expect(id).toBeDefined()
    })
  })

  describe('Notification Management', () => {
    it('should get all notifications', () => {
      notificationSystem.info('Test 1')
      notificationSystem.info('Test 2')

      const notifications = notificationSystem.getAll()
      expect(notifications.length).toBe(2)
    })

    it('should dismiss notification', () => {
      const id = notificationSystem.info('Test')
      const dismissed = notificationSystem.dismiss(id)

      expect(dismissed).toBe(true)
      expect(notificationSystem.getAll().length).toBe(0)
    })

    it('should mark notification as read', () => {
      const id = notificationSystem.info('Test')
      notificationSystem.markAsRead(id)

      const notifications = notificationSystem.getAll()
      expect(notifications[0].read).toBe(true)
    })

    it('should mark all as read', () => {
      notificationSystem.info('Test 1')
      notificationSystem.info('Test 2')
      notificationSystem.markAllAsRead()

      const notifications = notificationSystem.getAll()
      expect(notifications.every(n => n.read)).toBe(true)
    })

    it('should clear all notifications', () => {
      notificationSystem.info('Test 1')
      notificationSystem.info('Test 2')
      notificationSystem.clear()

      expect(notificationSystem.getAll().length).toBe(0)
    })
  })

  describe('Notification Queries', () => {
    it('should get unread notifications', () => {
      notificationSystem.info('Unread 1')
      notificationSystem.info('Unread 2')
      notificationSystem.markAsRead(notificationSystem.getAll()[0].id)

      const unread = notificationSystem.getUnread()
      expect(unread.length).toBe(1)
    })

    it('should get notifications by type', () => {
      notificationSystem.info('Info')
      notificationSystem.error('Error')
      notificationSystem.success('Success')

      const errors = notificationSystem.getByType('error')
      expect(errors.length).toBe(1)
      expect(errors[0].type).toBe('error')
    })

    it('should get notification count', () => {
      notificationSystem.info('Test 1')
      notificationSystem.info('Test 2')
      notificationSystem.markAsRead(notificationSystem.getAll()[0].id)

      const count = notificationSystem.getCount()
      expect(count.total).toBe(2)
      expect(count.unread).toBe(1)
    })
  })

  describe('Notification Subscription', () => {
    it('should subscribe to notifications', () => {
      const listener = vi.fn()
      const unsubscribe = notificationSystem.subscribe(listener)

      notificationSystem.info('Test')

      expect(listener).toHaveBeenCalled()

      unsubscribe()
    })
  })

  describe('Notification Options', () => {
    it('should create persistent notification', () => {
      const id = notificationSystem.notify('Persistent', { persistent: true })
      const notifications = notificationSystem.getAll()

      expect(notifications[0].persistent).toBe(true)
    })

    it('should create notification with title', () => {
      const id = notificationSystem.notify('Message', { title: 'Custom Title' })
      const notifications = notificationSystem.getAll()

      expect(notifications[0].title).toBe('Custom Title')
    })

    it('should create notification with actions', () => {
      const actions = [{ label: 'Action', onClick: vi.fn() }]
      const id = notificationSystem.notify('Message', { actions })
      const notifications = notificationSystem.getAll()

      expect(notifications[0].actions).toHaveLength(1)
    })
  })
})
