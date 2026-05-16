import { describe, it, expect, vi } from 'vitest'
import { changeLanguage, getCurrentLanguage, t } from '@/utils/i18n-service'

describe('i18nService Tests', () => {
  describe('Language Management', () => {
    it('should get current language', () => {
      const lang = getCurrentLanguage()
      expect(lang).toBeDefined()
    })

    it('should change language', async () => {
      await changeLanguage('en')
      const lang = getCurrentLanguage()
      expect(lang).toBe('en')
    })
  })

  describe('Translation', () => {
    it('should translate common.save', () => {
      changeLanguage('en')
      expect(t('common.save')).toBe('Save')
    })

    it('should translate to Chinese', async () => {
      await changeLanguage('zh')
      expect(t('common.save')).toBe('保存')
    })

    it('should translate task titles', () => {
      changeLanguage('en')
      expect(t('tasks.title')).toBe('Tasks')
    })
  })
})
