// Central service exports for the enhanced Miami Alter Ego app
// Following REFACTORING_PLAN.md Week 1 architecture

// Core services
export { 
  ImageGenerationService, 
  GeminiProvider, 
  ByteDanceSeedreamProvider,
  imageGenerationService,
  type IImageProvider,
  type GeneratedImageOutput
} from './ImageGenerationService';

export {
  PrintfulCommerceService,
  printfulCommerceService,
  type ICommerceService,
  type CommerceProduct,
  type OrderData,
  type OrderResult,
  type UserInfo
} from './PrintfulCommerceService';

export {
  WebhookService,
  webhookService,
  type IWebhookService,
  type AutomationEvent,
  type WebhookQueueItem
} from './WebhookService';

// Enhanced service integration
export class ServiceManager {
  private static instance: ServiceManager;
  
  public readonly imageGeneration: ImageGenerationService;
  public readonly commerce: PrintfulCommerceService;
  public readonly webhooks: WebhookService | null;

  private constructor() {
    // Initialize core services
    this.imageGeneration = imageGenerationService;
    
    // Initialize webhook service with error handling
    try {
      this.webhooks = webhookService;
      this.commerce = new PrintfulCommerceService(this.webhooks);
      console.log('✅ All services initialized with webhook integration');
    } catch (error) {
      console.warn('⚠️ Webhook service unavailable, using mock mode');
      this.webhooks = null;
      this.commerce = new PrintfulCommerceService();
    }
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  // Initialize all services
  async initialize(): Promise<void> {
    console.log('Initializing enhanced service architecture...');
    
    try {
      // Test webhook connectivity
      if (this.webhooks && this.webhooks.isEnabled()) {
        const webhookTest = await this.webhooks.testWebhook();
        console.log('Webhook service:', webhookTest ? 'Connected' : 'Failed to connect');
      } else {
        console.log('Webhook service: Not configured (using mock mode)');
      }

      // Check image generation providers
      const metrics = this.imageGeneration.getProviderMetrics();
      console.log('Image generation providers:', metrics);

      console.log('✅ Service architecture initialized successfully');
    } catch (error) {
      console.warn('⚠️ Some services failed to initialize (this is normal without API keys)');
      console.log('✅ Core functionality will work normally');
      throw error; // Re-throw to be caught by the caller
    }
  }

  // Get service health status
  async getHealthStatus(): Promise<Record<string, any>> {
    const status = {
      webhooks: this.webhooks ? {
        enabled: this.webhooks.isEnabled(),
        stats: this.webhooks.getStats(),
        queueSize: this.webhooks.getQueueSize()
      } : {
        enabled: false,
        stats: { totalSent: 0, totalFailed: 0, totalRetried: 0 },
        queueSize: 0
      },
      imageGeneration: {
        providers: this.imageGeneration.getProviderMetrics()
      },
      commerce: {
        available: !!import.meta.env.VITE_PRINTFUL_API_KEY
      }
    };

    return status;
  }

  // Enhanced image generation with commerce integration
  async generateImageWithCommerce(
    imageDataUrl: string,
    prompt: string,
    styleId: string,
    styleName: string,
    userInfo: UserInfo
  ): Promise<{
    image: GeneratedImageOutput;
    products: CommerceProduct[];
  }> {
    try {
      // Generate image
      const image = await this.imageGeneration.generateImage(
        imageDataUrl,
        prompt,
        styleId,
        styleName
      );

      // Emit webhook for image generation
      await this.webhooks.emitImageGenerated({
        imageId: image.id,
        userId: userInfo.id,
        userNickname: userInfo.nickname,
        styleName: image.metadata.styleName,
        styleId: image.metadata.styleId,
        provider: image.metadata.provider,
        generationTime: image.metadata.generationTime,
        imageUrl: image.urls.webDisplay,
        printReadyUrl: image.urls.printReady
      });

      // Create commerce products
      const products = await this.commerce.createProductsForImage(image, userInfo);

      return { image, products };
    } catch (error) {
      console.error('Enhanced image generation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceManager = ServiceManager.getInstance();
