import { logger } from './systemLogger';

// Webhook事件类型
export type WebhookEventType = 
  'TASK_CREATED' | 
  'TASK_COMPLETED' | 
  'TASK_FAILED' | 
  'SYSTEM_HEALTH_WARNING' | 
  'PERFORMANCE_ALERT' | 
  'ERROR_OCCURRED' |
  'PLUGIN_REGISTERED' |
  'CUSTOM_EVENT';

// Webhook配置
export interface WebhookConfig {
  id: string;
  url: string;
  name: string;
  events: WebhookEventType[];
  active: boolean;
  secret?: string;
  timeout?: number;
  maxRetries?: number;
}

// Webhook请求记录
export interface WebhookRequest {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  timestamp: number;
  payload: any;
  status: 'PENDING' | 'SENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  retryCount: number;
  response?: any;
  error?: string;
}

// Webhook交付报告
export interface WebhookDeliveryReport {
  total: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  eventBreakdown: Record<WebhookEventType, number>;
}

// Webhook管理器类
export class WebhookManager {
  private static instance: WebhookManager;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private requestQueue: WebhookRequest[] = [];
  private sentRequests: WebhookRequest[] = [];
  private maxQueueSize: number = 1000;
  private maxSentRequests: number = 100;
  private processing: boolean = false;

  private constructor() {
    logger.info('SYSTEM', 'WebhookManager initialized - External integration system ready');
  }

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  // 注册Webhook
  registerWebhook(config: WebhookConfig): boolean {
    if (this.webhooks.has(config.id)) {
      logger.warn('SYSTEM', `Webhook already registered: ${config.id}`);
      return false;
    }

    this.webhooks.set(config.id, config);
    logger.info('SYSTEM', `Webhook registered: ${config.name} (${config.events.length} events)`, {
      webhookId: config.id,
      url: config.url
    });
    return true;
  }

  // 更新Webhook
  updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): boolean {
    const existing = this.webhooks.get(webhookId);
    if (!existing) {
      logger.error('SYSTEM', `Webhook not found: ${webhookId}`);
      return false;
    }

    const updated = { ...existing, ...updates };
    this.webhooks.set(webhookId, updated);
    logger.info('SYSTEM', `Webhook updated: ${updated.name}`);
    return true;
  }

  // 删除Webhook
  unregisterWebhook(webhookId: string): boolean {
    const deleted = this.webhooks.delete(webhookId);
    if (deleted) {
      logger.info('SYSTEM', `Webhook unregistered: ${webhookId}`);
    }
    return deleted;
  }

  // 获取Webhook
  getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  // 获取所有Webhook
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  // 发送事件
  async sendEvent(eventType: WebhookEventType, payload: any): Promise<WebhookRequest[]> {
    const requests: WebhookRequest[] = [];

    this.webhooks.forEach(config => {
      if (!config.active) return;
      if (!config.events.includes(eventType)) return;

      const request: WebhookRequest = {
        id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        webhookId: config.id,
        eventType,
        timestamp: Date.now(),
        payload,
        status: 'PENDING',
        retryCount: 0
      };

      requests.push(request);
    });

    if (requests.length === 0) {
      logger.debug('SYSTEM', `No active webhooks for event: ${eventType}`);
      return [];
    }

    // 添加到队列
    requests.forEach(req => {
      this.requestQueue.push(req);
    });

    if (this.requestQueue.length > this.maxQueueSize) {
      const removeCount = this.requestQueue.length - this.maxQueueSize;
      this.requestQueue = this.requestQueue.slice(removeCount);
    }

    logger.info('SYSTEM', `Queued ${requests.length} webhook requests for event: ${eventType}`);

    // 开始处理队列
    if (!this.processing) {
      this.processQueue();
    }

    return requests;
  }

  // 处理队列
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      try {
        await this.processRequest(request);
      } catch (error) {
        logger.error('SYSTEM', `Failed to process webhook request: ${request.id}`, error);
      }
    }

    this.processing = false;
  }

  // 处理单个请求
  private async processRequest(request: WebhookRequest): Promise<void> {
    const config = this.webhooks.get(request.webhookId);
    if (!config) {
      logger.error('SYSTEM', `Webhook config not found: ${request.webhookId}`);
      return;
    }

    request.status = 'SENDING';

    const maxRetries = config.maxRetries || 3;
    const timeout = config.timeout || 10000;

    try {
      const result = await this.sendHttpRequest(config, request, timeout);
      
      request.status = 'SUCCESS';
      request.response = result;
      
      logger.info('SYSTEM', `Webhook delivered successfully: ${config.name} (${request.eventType})`, {
        webhookId: config.id,
        eventType: request.eventType
      });

    } catch (error) {
      request.retryCount++;

      if (request.retryCount < maxRetries) {
        request.status = 'RETRYING';
        logger.warn('SYSTEM', `Webhook delivery failed, retrying (${request.retryCount}/${maxRetries}): ${config.name}`);
        
        // 重入队列
        setTimeout(() => {
          this.requestQueue.push(request);
          if (!this.processing) {
            this.processQueue();
          }
        }, Math.pow(2, request.retryCount) * 1000);
      } else {
        request.status = 'FAILED';
        request.error = error instanceof Error ? error.message : String(error);
        
        logger.error('SYSTEM', `Webhook delivery failed after ${maxRetries} retries: ${config.name}`, error);
      }
    }

    // 保存到已发送
    this.sentRequests.push(request);
    if (this.sentRequests.length > this.maxSentRequests) {
      this.sentRequests.shift();
    }
  }

  // 发送HTTP请求
  private async sendHttpRequest(
    config: WebhookConfig,
    request: WebhookRequest,
    timeout: number
  ): Promise<any> {
    const payload = {
      eventType: request.eventType,
      timestamp: request.timestamp,
      data: request.payload,
      webhookId: config.id,
      requestId: request.id
    };

    logger.debug('SYSTEM', `Sending webhook to ${config.url}`, {
      eventType: request.eventType,
      payloadSize: JSON.stringify(payload).length
    });

    // 模拟HTTP请求（真实环境下使用fetch）
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          status: 200,
          statusText: 'OK',
          deliveredAt: Date.now()
        });
      }, Math.random() * 500);
    });
  }

  // 获取请求历史
  getRequestHistory(options?: {
    webhookId?: string;
    eventType?: WebhookEventType;
    status?: 'PENDING' | 'SENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
    limit?: number;
  }): WebhookRequest[] {
    let filtered = [...this.sentRequests];

    if (options?.webhookId) {
      filtered = filtered.filter(r => r.webhookId === options.webhookId);
    }

    if (options?.eventType) {
      filtered = filtered.filter(r => r.eventType === options.eventType);
    }

    if (options?.status) {
      filtered = filtered.filter(r => r.status === options.status);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  // 获取交付报告
  getDeliveryReport(): WebhookDeliveryReport {
    const report: WebhookDeliveryReport = {
      total: this.sentRequests.length,
      successful: 0,
      failed: 0,
      avgResponseTime: 0,
      eventBreakdown: {
        'TASK_CREATED': 0,
        'TASK_COMPLETED': 0,
        'TASK_FAILED': 0,
        'SYSTEM_HEALTH_WARNING': 0,
        'PERFORMANCE_ALERT': 0,
        'ERROR_OCCURRED': 0,
        'PLUGIN_REGISTERED': 0,
        'CUSTOM_EVENT': 0
      }
    };

    let totalResponseTime = 0;

    this.sentRequests.forEach(req => {
      if (req.status === 'SUCCESS') {
        report.successful++;
      } else if (req.status === 'FAILED') {
        report.failed++;
      }

      report.eventBreakdown[req.eventType]++;
    });

    return report;
  }

  // 清空队列
  clearQueue(): void {
    this.requestQueue = [];
    logger.info('SYSTEM', 'Webhook queue cleared');
  }

  // 清空历史
  clearHistory(): void {
    this.sentRequests = [];
    logger.info('SYSTEM', 'Webhook history cleared');
  }

  // 获取状态
  getStatus(): {
    webhookCount: number;
    activeCount: number;
    pendingRequests: number;
    totalSent: number;
  } {
    const activeCount = Array.from(this.webhooks.values()).filter(w => w.active).length;

    return {
      webhookCount: this.webhooks.size,
      activeCount,
      pendingRequests: this.requestQueue.length,
      totalSent: this.sentRequests.length
    };
  }
}

// API集成器
export class ExternalApiIntegrator {
  private static instance: ExternalApiIntegrator;
  private apiClients: Map<string, any> = new Map();

  private constructor() {
    logger.info('SYSTEM', 'ExternalApiIntegrator initialized - Third-party integration system ready');
  }

  static getInstance(): ExternalApiIntegrator {
    if (!ExternalApiIntegrator.instance) {
      ExternalApiIntegrator.instance = new ExternalApiIntegrator();
    }
    return ExternalApiIntegrator.instance;
  }

  // 注册API客户端
  registerApiClient(apiName: string, client: any): void {
    this.apiClients.set(apiName, client);
    logger.info('SYSTEM', `API client registered: ${apiName}`);
  }

  // 获取API客户端
  getApiClient(apiName: string): any | null {
    return this.apiClients.get(apiName) || null;
  }

  // 列出所有API
  listRegisteredApis(): string[] {
    return Array.from(this.apiClients.keys());
  }

  // 执行API调用
  async executeApiCall(apiName: string, method: string, params: any): Promise<any> {
    const client = this.apiClients.get(apiName);
    if (!client) {
      throw new Error(`API client not found: ${apiName}`);
    }

    logger.info('SYSTEM', `Executing API call: ${apiName}.${method}`, { params });

    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { result: 'API call completed', params },
          timestamp: Date.now()
        });
      }, Math.random() * 100 + 50);
    });
  }
}

export const webhookManager = WebhookManager.getInstance();
export const externalApiIntegrator = ExternalApiIntegrator.getInstance();
