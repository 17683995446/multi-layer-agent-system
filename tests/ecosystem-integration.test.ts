import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  pluginManager, 
  ExampleAnalyticsPlugin, 
  ExampleNotificationPlugin, 
  Plugin 
} from '../src/utils/plugin-system';
import { 
  webhookManager, 
  externalApiIntegrator 
} from '../src/utils/webhook-integration';

describe('Ecosystem Integration Tests - Phase 8', () => {
  beforeEach(() => {
    // 清理状态
    pluginManager.unregisterPlugin('example-analytics-plugin');
    pluginManager.unregisterPlugin('example-notification-plugin');
    webhookManager.clearQueue();
    webhookManager.clearHistory();
  });

  describe('Plugin System Tests', () => {
    it('should register and manage plugins correctly', async () => {
      const analyticsPlugin = new ExampleAnalyticsPlugin();
      const success = await pluginManager.registerPlugin(analyticsPlugin);

      expect(success).toBe(true);
      
      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins.length).toBe(1);
      expect(allPlugins[0].id).toBe('example-analytics-plugin');
    });

    it('should execute plugin operations', async () => {
      const analyticsPlugin = new ExampleAnalyticsPlugin();
      await pluginManager.registerPlugin(analyticsPlugin);

      const result = await pluginManager.executePlugin(
        'example-analytics-plugin',
        { event: 'test_event', value: 42 }
      );

      expect(result.success).toBe(true);
      expect(result.tracked).toBe(true);
    });

    it('should handle multiple plugins', async () => {
      const analyticsPlugin = new ExampleAnalyticsPlugin();
      const notificationPlugin = new ExampleNotificationPlugin();

      await pluginManager.registerPlugin(analyticsPlugin);
      await pluginManager.registerPlugin(notificationPlugin);

      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins.length).toBe(2);

      // 执行两个插件
      const analyticsResult = await pluginManager.executePlugin(
        'example-analytics-plugin',
        { test: 'data' }
      );
      const notificationResult = await pluginManager.executePlugin(
        'example-notification-plugin',
        { message: 'Test notification', type: 'info' }
      );

      expect(analyticsResult.success).toBe(true);
      expect(notificationResult.success).toBe(true);
    });

    it('should manage plugin lifecycle', async () => {
      const plugin = new ExampleAnalyticsPlugin();
      await pluginManager.registerPlugin(plugin);
      
      const enableSuccess = await pluginManager.enablePlugin('example-analytics-plugin');
      expect(enableSuccess).toBe(true);

      const disableSuccess = await pluginManager.disablePlugin('example-analytics-plugin');
      expect(disableSuccess).toBe(true);

      const stats = pluginManager.getPluginStats('example-analytics-plugin');
      expect(stats).not.toBeNull();
    });

    it('should emit and listen to events', async () => {
      const plugin = new ExampleAnalyticsPlugin();
      await pluginManager.registerPlugin(plugin);

      let eventReceived = false;
      const unsubscribe = pluginManager.on('PLUGIN_ENABLED', (event) => {
        eventReceived = true;
        expect(event.payload.pluginId).toBe('example-analytics-plugin');
      });

      await pluginManager.enablePlugin('example-analytics-plugin');
      
      // 给事件系统一些时间
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(eventReceived).toBe(true);
      
      unsubscribe();
    });
  });

  describe('Webhook System Tests', () => {
    it('should register and manage webhooks', () => {
      const webhook = {
        id: 'test-webhook-1',
        url: 'https://example.com/webhook',
        name: 'Test Webhook',
        events: ['TASK_CREATED', 'TASK_COMPLETED'] as any[],
        active: true
      };

      const success = webhookManager.registerWebhook(webhook);
      expect(success).toBe(true);

      const allWebhooks = webhookManager.getAllWebhooks();
      expect(allWebhooks.length).toBe(1);
      expect(allWebhooks[0].id).toBe('test-webhook-1');
    });

    it('should send webhook events', async () => {
      const webhook = {
        id: 'test-webhook-2',
        url: 'https://example.com/webhook',
        name: 'Event Webhook',
        events: ['TASK_CREATED'] as any[],
        active: true
      };

      webhookManager.registerWebhook(webhook);

      const requests = await webhookManager.sendEvent('TASK_CREATED', {
        taskId: 'task-123',
        name: 'Test Task'
      });

      expect(requests.length).toBeGreaterThan(0);
    });

    it('should track webhook delivery', async () => {
      const webhook = {
        id: 'test-webhook-3',
        url: 'https://example.com/webhook',
        name: 'Tracking Webhook',
        events: ['CUSTOM_EVENT'] as any[],
        active: true
      };

      webhookManager.registerWebhook(webhook);

      await webhookManager.sendEvent('CUSTOM_EVENT', { test: true });
      
      // 给队列一些时间处理
      await new Promise(resolve => setTimeout(resolve, 100));

      const report = webhookManager.getDeliveryReport();
      expect(report.total).toBeGreaterThan(0);
    });

    it('should handle multiple webhooks and events', async () => {
      // 注册多个Webhook
      const webhook1 = {
        id: 'multi-webhook-1',
        url: 'https://example.com/webhook1',
        name: 'Webhook 1',
        events: ['TASK_CREATED'] as any[],
        active: true
      };

      const webhook2 = {
        id: 'multi-webhook-2',
        url: 'https://example.com/webhook2',
        name: 'Webhook 2',
        events: ['TASK_COMPLETED'] as any[],
        active: true
      };

      webhookManager.registerWebhook(webhook1);
      webhookManager.registerWebhook(webhook2);

      // 发送多个事件
      await webhookManager.sendEvent('TASK_CREATED', { taskId: '1' });
      await webhookManager.sendEvent('TASK_COMPLETED', { taskId: '1' });

      // 给队列一些时间处理
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = webhookManager.getStatus();
      expect(status.webhookCount).toBe(2);
    });
  });

  describe('External API Integration Tests', () => {
    it('should register API clients', () => {
      const mockClient = {
        sendMessage: async (msg: string) => ({ success: true, message: msg })
      };

      externalApiIntegrator.registerApiClient('mock-service', mockClient);
      
      const registeredApis = externalApiIntegrator.listRegisteredApis();
      expect(registeredApis).toContain('mock-service');
    });

    it('should execute API calls', async () => {
      const mockClient = {
        getData: async () => ({ data: [1, 2, 3] })
      };

      externalApiIntegrator.registerApiClient('data-service', mockClient);

      const result = await externalApiIntegrator.executeApiCall(
        'data-service',
        'getData',
        { limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });
  });

  describe('Ecosystem Integration Tests', () => {
    it('should integrate plugins with webhooks', async () => {
      // 1. 注册插件
      const notificationPlugin = new ExampleNotificationPlugin();
      await pluginManager.registerPlugin(notificationPlugin);

      // 2. 注册Webhook
      const webhook = {
        id: 'integration-webhook',
        url: 'https://example.com/notify',
        name: 'Integration Webhook',
        events: ['PLUGIN_REGISTERED'] as any[],
        active: true
      };

      webhookManager.registerWebhook(webhook);

      // 3. 执行插件操作
      const pluginResult = await pluginManager.executePlugin(
        'example-notification-plugin',
        { message: 'Ecosystem test', type: 'info' }
      );

      // 4. 发送事件
      const webhookRequests = await webhookManager.sendEvent(
        'PLUGIN_REGISTERED',
        { pluginId: 'example-notification-plugin' }
      );

      expect(pluginResult.success).toBe(true);
      expect(webhookRequests.length).toBeGreaterThan(0);
    });

    it('should handle large scale operations', async () => {
      // 注册多个插件
      for (let i = 0; i < 5; i++) {
        const plugin: Plugin = {
          metadata: {
            id: `bulk-plugin-${i}`,
            name: `Bulk Plugin ${i}`,
            version: '1.0.0',
            author: 'Test',
            description: 'Bulk test plugin',
            type: 'CUSTOM'
          },
          config: {},
          permissions: {
            readSystemState: false,
            writeSystemState: false,
            accessStorage: false,
            sendNotifications: false,
            makeExternalRequests: false,
            modifyUI: false,
            accessLogs: false
          },
          execute: async (input) => ({ processed: input })
        };

        await pluginManager.registerPlugin(plugin);
      }

      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins.length).toBe(5);
    });

    it('should provide system health monitoring', () => {
      const systemState = pluginManager.getSystemState();
      
      expect(systemState.pluginCount).toBeDefined();
      expect(systemState.totalCalls).toBeDefined();
      expect(Array.isArray(systemState.events)).toBe(true);
    });
  });
});

console.log('\n✅ Phase 8 - Ecosystem Integration Tests Completed!\n');
