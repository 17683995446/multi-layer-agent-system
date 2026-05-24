import { logger } from './systemLogger';

// 插件类型定义
export type PluginType = 'STORAGE' | 'ANALYTICS' | 'NOTIFICATION' | 'MONITORING' | 'UI_EXTENSION' | 'INTEGRATION' | 'CUSTOM';

// 插件状态
export type PluginStatus = 'DISABLED' | 'LOADING' | 'LOADED' | 'RUNNING' | 'ERROR' | 'CRASHED';

// 插件权限
export interface PluginPermissions {
  readSystemState: boolean;
  writeSystemState: boolean;
  accessStorage: boolean;
  sendNotifications: boolean;
  makeExternalRequests: boolean;
  modifyUI: boolean;
  accessLogs: boolean;
}

// 插件元数据
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  type: PluginType;
  homepage?: string;
  repository?: string;
  tags?: string[];
}

// 插件配置
export interface PluginConfig {
  [key: string]: any;
}

// 插件生命周期钩子
export interface PluginLifecycle {
  onLoad?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onError?: (error: Error) => void;
}

// 插件接口
export interface Plugin extends PluginLifecycle {
  metadata: PluginMetadata;
  config: PluginConfig;
  permissions: PluginPermissions;
  execute?: (input: any) => Promise<any>;
  [key: string]: any;
}

// 插件注册信息
export interface PluginRegistration {
  plugin: Plugin;
  timestamp: number;
  lastActivity: number;
  callCount: number;
}

// 插件沙箱上下文
export interface PluginSandbox {
  pluginId: string;
  restrictedApis: Set<string>;
  log: (message: string, data?: any) => void;
  error: (error: Error) => void;
}

// 插件事件
export interface PluginEvent {
  type: string;
  payload: any;
  timestamp: number;
  sourcePluginId?: string;
}

// 事件监听器
export type PluginEventListener = (event: PluginEvent) => void;

// 插件管理器类
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, PluginRegistration> = new Map();
  private events: Map<string, Set<PluginEventListener>> = new Map();
  private sandboxedPlugins: Set<string> = new Set();
  private maxPlugins: number = 100;

  private constructor() {
    logger.info('SYSTEM', 'PluginManager initialized - Ecological integration system ready');
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  // 注册插件
  async registerPlugin(plugin: Plugin): Promise<boolean> {
    if (this.plugins.size >= this.maxPlugins) {
      logger.error('SYSTEM', `Plugin registration failed - Max plugin limit (${this.maxPlugins}) reached`, {
        pluginId: plugin.metadata.id
      });
      return false;
    }

    if (this.plugins.has(plugin.metadata.id)) {
      logger.warn('SYSTEM', `Plugin already registered: ${plugin.metadata.id}`);
      return false;
    }

    try {
      const registration: PluginRegistration = {
        plugin,
        timestamp: Date.now(),
        lastActivity: Date.now(),
        callCount: 0
      };

      this.plugins.set(plugin.metadata.id, registration);

      if (plugin.onLoad) {
        await plugin.onLoad();
      }

      logger.info('SYSTEM', `Plugin registered successfully: ${plugin.metadata.name} v${plugin.metadata.version}`, {
        pluginId: plugin.metadata.id,
        type: plugin.metadata.type
      });

      this.emitEvent({
        type: 'PLUGIN_REGISTERED',
        payload: { pluginId: plugin.metadata.id },
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      logger.error('SYSTEM', `Failed to register plugin: ${plugin.metadata.id}`, error);
      return false;
    }
  }

  // 启用插件
  async enablePlugin(pluginId: string): Promise<boolean> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.error('SYSTEM', `Plugin not found: ${pluginId}`);
      return false;
    }

    try {
      if (registration.plugin.onEnable) {
        await registration.plugin.onEnable();
      }

      logger.info('SYSTEM', `Plugin enabled: ${registration.plugin.metadata.name}`);

      this.emitEvent({
        type: 'PLUGIN_ENABLED',
        payload: { pluginId },
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      logger.error('SYSTEM', `Failed to enable plugin: ${pluginId}`, error);
      return false;
    }
  }

  // 禁用插件
  async disablePlugin(pluginId: string): Promise<boolean> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.error('SYSTEM', `Plugin not found: ${pluginId}`);
      return false;
    }

    try {
      if (registration.plugin.onDisable) {
        await registration.plugin.onDisable();
      }

      logger.info('SYSTEM', `Plugin disabled: ${registration.plugin.metadata.name}`);

      this.emitEvent({
        type: 'PLUGIN_DISABLED',
        payload: { pluginId },
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      logger.error('SYSTEM', `Failed to disable plugin: ${pluginId}`, error);
      return false;
    }
  }

  // 卸载插件
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.error('SYSTEM', `Plugin not found: ${pluginId}`);
      return false;
    }

    try {
      if (registration.plugin.onUnload) {
        await registration.plugin.onUnload();
      }

      this.plugins.delete(pluginId);
      this.sandboxedPlugins.delete(pluginId);

      logger.info('SYSTEM', `Plugin unregistered: ${registration.plugin.metadata.name}`);

      this.emitEvent({
        type: 'PLUGIN_UNREGISTERED',
        payload: { pluginId },
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      logger.error('SYSTEM', `Failed to unregister plugin: ${pluginId}`, error);
      return false;
    }
  }

  // 执行插件
  async executePlugin(pluginId: string, input: any): Promise<any> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.error('SYSTEM', `Plugin not found: ${pluginId}`);
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    registration.callCount++;
    registration.lastActivity = Date.now();

    if (!registration.plugin.execute) {
      logger.warn('SYSTEM', `Plugin has no execute method: ${pluginId}`);
      return null;
    }

    try {
      const result = await registration.plugin.execute(input);
      logger.debug('SYSTEM', `Plugin executed successfully: ${pluginId}`, {
        input: typeof input === 'object' ? '[object]' : input,
        output: typeof result === 'object' ? '[object]' : result
      });
      return result;
    } catch (error) {
      logger.error('SYSTEM', `Plugin execution failed: ${pluginId}`, error);
      
      if (registration.plugin.onError) {
        registration.plugin.onError(error as Error);
      }
      
      throw error;
    }
  }

  // 事件系统
  on(eventType: string, listener: PluginEventListener): () => void {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, new Set());
    }
    this.events.get(eventType)!.add(listener);

    logger.debug('SYSTEM', `Event listener added: ${eventType}`);

    return () => {
      this.off(eventType, listener);
    };
  }

  off(eventType: string, listener: PluginEventListener): void {
    const listeners = this.events.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      logger.debug('SYSTEM', `Event listener removed: ${eventType}`);
    }
  }

  private emitEvent(event: PluginEvent): void {
    const listeners = this.events.get(event.type);
    if (!listeners) return;

    logger.debug('SYSTEM', `Emitting event: ${event.type}`);

    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('SYSTEM', `Event listener failed for ${event.type}`, error);
      }
    });
  }

  // 获取插件信息
  getPlugin(pluginId: string): Plugin | null {
    const registration = this.plugins.get(pluginId);
    return registration ? registration.plugin : null;
  }

  getAllPlugins(): PluginMetadata[] {
    const plugins: PluginMetadata[] = [];
    this.plugins.forEach(registration => {
      plugins.push(registration.plugin.metadata);
    });
    return plugins;
  }

  getPluginStats(pluginId: string): { callCount: number; lastActivity: number; uptime: number } | null {
    const registration = this.plugins.get(pluginId);
    if (!registration) return null;

    return {
      callCount: registration.callCount,
      lastActivity: registration.lastActivity,
      uptime: Date.now() - registration.timestamp
    };
  }

  // 沙箱管理
  enableSandbox(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.error('SYSTEM', `Plugin not found: ${pluginId}`);
      return false;
    }

    this.sandboxedPlugins.add(pluginId);
    logger.info('SYSTEM', `Sandbox enabled for plugin: ${pluginId}`);
    return true;
  }

  disableSandbox(pluginId: string): boolean {
    this.sandboxedPlugins.delete(pluginId);
    logger.info('SYSTEM', `Sandbox disabled for plugin: ${pluginId}`);
    return true;
  }

  isSandboxed(pluginId: string): boolean {
    return this.sandboxedPlugins.has(pluginId);
  }

  // 获取系统状态
  getSystemState(): {
    pluginCount: number;
    sandboxedCount: number;
    totalCalls: number;
    events: string[];
  } {
    let totalCalls = 0;
    this.plugins.forEach(registration => {
      totalCalls += registration.callCount;
    });

    return {
      pluginCount: this.plugins.size,
      sandboxedCount: this.sandboxedPlugins.size,
      totalCalls,
      events: Array.from(this.events.keys())
    };
  }
}

// 示例插件 - 用于演示
export class ExampleAnalyticsPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'example-analytics-plugin',
    name: 'Example Analytics Plugin',
    version: '1.0.0',
    author: 'System Team',
    description: 'An example plugin that demonstrates plugin system capabilities',
    type: 'ANALYTICS',
    tags: ['analytics', 'monitoring', 'example']
  };

  config: PluginConfig = {};

  permissions: PluginPermissions = {
    readSystemState: true,
    writeSystemState: false,
    accessStorage: true,
    sendNotifications: false,
    makeExternalRequests: false,
    modifyUI: false,
    accessLogs: true
  };

  private analyticsData: any[] = [];

  async onLoad(): Promise<void> {
    logger.info('SYSTEM', 'ExampleAnalyticsPlugin loaded - Tracking analytics initialized');
  }

  async onEnable(): Promise<void> {
    logger.info('SYSTEM', 'ExampleAnalyticsPlugin enabled');
  }

  async execute(input: any): Promise<any> {
    this.analyticsData.push({
      event: input,
      timestamp: Date.now()
    });

    return {
      success: true,
      tracked: true,
      totalTracked: this.analyticsData.length
    };
  }
}

export class ExampleNotificationPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'example-notification-plugin',
    name: 'Example Notification Plugin',
    version: '1.0.0',
    author: 'System Team',
    description: 'An example plugin that demonstrates notification capabilities',
    type: 'NOTIFICATION',
    tags: ['notification', 'alert', 'example']
  };

  config: PluginConfig = {
    maxNotifications: 100
  };

  permissions: PluginPermissions = {
    readSystemState: true,
    writeSystemState: false,
    accessStorage: false,
    sendNotifications: true,
    makeExternalRequests: false,
    modifyUI: false,
    accessLogs: false
  };

  private notifications: any[] = [];

  async onLoad(): Promise<void> {
    logger.info('SYSTEM', 'ExampleNotificationPlugin loaded - Notification system ready');
  }

  async execute(input: any): Promise<any> {
    const notification = {
      id: Date.now().toString(),
      message: input.message || 'System notification',
      type: input.type || 'info',
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    if (this.notifications.length > this.config.maxNotifications) {
      this.notifications.shift();
    }

    logger.info('SYSTEM', `Notification sent: ${notification.message}`);

    return {
      success: true,
      notificationId: notification.id
    };
  }
}

export const pluginManager = PluginManager.getInstance();
