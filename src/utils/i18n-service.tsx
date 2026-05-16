import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        confirm: 'Confirm',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success'
      },
      tasks: {
        title: 'Tasks',
        addTask: 'Add Task',
        deleteTask: 'Delete Task',
        taskName: 'Task Name',
        taskStatus: 'Status',
        priority: 'Priority',
        pending: 'Pending',
        running: 'Running',
        completed: 'Completed'
      },
      settings: {
        title: 'Settings',
        theme: 'Theme',
        language: 'Language',
        notifications: 'Notifications'
      }
    }
  },
  zh: {
    translation: {
      common: {
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        confirm: '确认',
        loading: '加载中...',
        error: '错误',
        success: '成功'
      },
      tasks: {
        title: '任务',
        addTask: '添加任务',
        deleteTask: '删除任务',
        taskName: '任务名称',
        taskStatus: '状态',
        priority: '优先级',
        pending: '待处理',
        running: '运行中',
        completed: '已完成'
      },
      settings: {
        title: '设置',
        theme: '主题',
        language: '语言',
        notifications: '通知'
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n

export function changeLanguage(lng: string) {
  return i18n.changeLanguage(lng)
}

export function getCurrentLanguage() {
  return i18n.language
}

export function t(key: string, options?: any) {
  return i18n.t(key, options)
}
