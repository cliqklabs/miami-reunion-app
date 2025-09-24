// WebhookService for N8n automation following REFACTORING_PLAN.md structure

export interface AutomationEvent {
  type: 'image_generated' | 'products_created' | 'order_placed' | 'contest_created' | 'vote_cast' | 'contest_winner' | 'social_share';
  data: Record<string, any>;
  timestamp?: string;
  eventId?: string;
  userId?: string;
}

export interface WebhookQueueItem {
  id: string;
  event: AutomationEvent;
  attempts: number;
  nextRetry: Date;
  maxRetries: number;
  createdAt: Date;
}

export interface IWebhookService {
  emit(event: AutomationEvent): Promise<void>;
  emitBatch(events: AutomationEvent[]): Promise<void>;
  getQueueStatus(): Promise<{ pending: number; failed: number; processed: number }>;
  retryFailedWebhooks(): Promise<number>;
}

export class WebhookService implements IWebhookService {
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds
  private failedQueue: Map<string, WebhookQueueItem> = new Map();
  private isProcessingQueue: boolean = false;

  // Statistics
  private stats = {
    totalSent: 0,
    totalFailed: 0,
    totalRetried: 0
  };

  constructor() {
    try {
      this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      this.webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET || '';
      
      if (!this.webhookUrl) {
        console.log('⚠️ N8n webhook URL not configured - automation will use mock mode');
      } else {
        console.log('✅ N8n webhook service configured');
      }

      // Start periodic retry processing
      this.startRetryProcessor();
    } catch (error) {
      console.warn('⚠️ Webhook service initialization failed:', error);
    }
  }

  async emit(event: AutomationEvent): Promise<void> {
    try {
      if (!this.webhookUrl) {
        console.log('Webhook disabled - would have sent:', event.type, event.data);
        return;
      }

      const payload = this.preparePayload(event);
      
      console.log(`Sending webhook: ${event.type}`, payload);
      
      await this.sendWebhook(payload);
      this.stats.totalSent++;
      
      console.log(`Webhook sent successfully: ${event.type}`);
    } catch (error) {
      console.error(`Webhook failed for ${event.type}:`, error);
      await this.queueFailedWebhook(event);
    }
  }

  async emitBatch(events: AutomationEvent[]): Promise<void> {
    const batchPromises = events.map(event => this.emit(event));
    await Promise.allSettled(batchPromises);
  }

  private preparePayload(event: AutomationEvent): any {
    return {
      timestamp: event.timestamp || new Date().toISOString(),
      source: 'miami-alter-ego-app',
      environment: import.meta.env.MODE || 'development',
      type: event.type,
      eventId: event.eventId || this.generateEventId(),
      userId: event.userId,
      data: {
        ...event.data,
        // Add common metadata
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href
      }
    };
  }

  private async sendWebhook(payload: any): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.webhookSecret ? `Bearer ${this.webhookSecret}` : '',
        'X-Webhook-Source': 'miami-alter-ego-app',
        'X-Event-Type': payload.type
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook request failed: ${response.status} - ${errorText}`);
    }

    // Log successful webhook for debugging
    const responseData = await response.text();
    console.log('Webhook response:', response.status, responseData);
  }

  private async queueFailedWebhook(event: AutomationEvent): Promise<void> {
    const queueItem: WebhookQueueItem = {
      id: this.generateEventId(),
      event,
      attempts: 0,
      nextRetry: new Date(Date.now() + this.retryDelay),
      maxRetries: this.maxRetries,
      createdAt: new Date()
    };

    this.failedQueue.set(queueItem.id, queueItem);
    this.stats.totalFailed++;
    
    console.log(`Queued failed webhook for retry: ${event.type} (Queue size: ${this.failedQueue.size})`);
  }

  private startRetryProcessor(): void {
    setInterval(async () => {
      if (this.isProcessingQueue || this.failedQueue.size === 0) {
        return;
      }

      this.isProcessingQueue = true;
      try {
        await this.processRetryQueue();
      } catch (error) {
        console.error('Error processing retry queue:', error);
      } finally {
        this.isProcessingQueue = false;
      }
    }, 30000); // Check every 30 seconds
  }

  private async processRetryQueue(): Promise<void> {
    const now = new Date();
    const itemsToRetry = Array.from(this.failedQueue.values())
      .filter(item => item.nextRetry <= now && item.attempts < item.maxRetries);

    if (itemsToRetry.length === 0) {
      return;
    }

    console.log(`Retrying ${itemsToRetry.length} failed webhooks...`);

    for (const item of itemsToRetry) {
      try {
        item.attempts++;
        
        const payload = this.preparePayload(item.event);
        await this.sendWebhook(payload);
        
        // Success - remove from queue
        this.failedQueue.delete(item.id);
        this.stats.totalRetried++;
        
        console.log(`Retry successful for ${item.event.type} (attempt ${item.attempts})`);
      } catch (error) {
        console.error(`Retry failed for ${item.event.type} (attempt ${item.attempts}):`, error);
        
        if (item.attempts >= item.maxRetries) {
          // Max retries reached - remove from queue
          this.failedQueue.delete(item.id);
          console.warn(`Max retries reached for ${item.event.type}, removing from queue`);
        } else {
          // Schedule next retry with exponential backoff
          const backoffDelay = this.retryDelay * Math.pow(2, item.attempts - 1);
          item.nextRetry = new Date(Date.now() + backoffDelay);
          console.log(`Scheduled next retry for ${item.event.type} in ${backoffDelay}ms`);
        }
      }
    }
  }

  async retryFailedWebhooks(): Promise<number> {
    if (this.failedQueue.size === 0) {
      return 0;
    }

    const initialCount = this.failedQueue.size;
    await this.processRetryQueue();
    
    return initialCount - this.failedQueue.size;
  }

  async getQueueStatus(): Promise<{ pending: number; failed: number; processed: number }> {
    return {
      pending: this.failedQueue.size,
      failed: this.stats.totalFailed,
      processed: this.stats.totalSent + this.stats.totalRetried
    };
  }

  // Specific webhook helpers for common events
  async emitImageGenerated(data: {
    imageId: string;
    userId: string;
    userNickname: string;
    styleName: string;
    styleId: string;
    provider: string;
    generationTime: number;
    imageUrl: string;
    printReadyUrl: string;
  }): Promise<void> {
    await this.emit({
      type: 'image_generated',
      data,
      userId: data.userId
    });
  }

  async emitProductsCreated(data: {
    imageId: string;
    userId: string;
    userNickname: string;
    styleName: string;
    productCount: number;
    printfulProductId: string;
    products: Array<{ id: string; type: string; price: number; }>;
  }): Promise<void> {
    await this.emit({
      type: 'products_created',
      data,
      userId: data.userId
    });
  }

  async emitOrderPlaced(data: {
    orderId: string;
    hostPayout: number;
    platformRevenue: number;
    customerName: string;
    eventId?: string;
    hostEmail?: string;
    total: number;
    trackingNumber?: string;
    products: any[];
  }): Promise<void> {
    await this.emit({
      type: 'order_placed',
      data,
      eventId: data.eventId
    });
  }

  async emitSocialShare(data: {
    userId: string;
    platform: 'telegram' | 'whatsapp' | 'instagram' | 'facebook';
    imageId: string;
    styleName: string;
    shareUrl: string;
  }): Promise<void> {
    await this.emit({
      type: 'social_share',
      data,
      userId: data.userId
    });
  }

  // Analytics and monitoring
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  getQueueSize(): number {
    return this.failedQueue.size;
  }

  clearStats(): void {
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      totalRetried: 0
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Development helpers
  async testWebhook(): Promise<boolean> {
    try {
      await this.emit({
        type: 'image_generated',
        data: {
          test: true,
          message: 'Webhook test from Miami Alter Ego app',
          timestamp: new Date().toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  // Enable/disable webhooks dynamically
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Webhooks ${enabled ? 'enabled' : 'disabled'}`);
  }

  isEnabled(): boolean {
    return this.enabled && !!this.webhookUrl;
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
