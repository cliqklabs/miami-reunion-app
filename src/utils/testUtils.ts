// Testing utilities for the enhanced Miami Alter Ego app

import { serviceManager } from '../services';

export class TestUtils {
  // Test service health and configuration
  static async checkServiceHealth(): Promise<Record<string, any>> {
    console.log('🔍 Checking service health...');
    
    const health = await serviceManager.getHealthStatus();
    
    console.log('📊 Service Health Status:');
    console.table({
      'Webhooks Enabled': health.webhooks.enabled,
      'Webhook Queue Size': health.webhooks.queueSize,
      'Total Webhooks Sent': health.webhooks.stats.totalSent,
      'Total Webhooks Failed': health.webhooks.stats.totalFailed,
      'Commerce Available': health.commerce.available,
      'Gemini Available': !!import.meta.env.VITE_GEMINI_API_KEY,
      'ByteDance Available': !!import.meta.env.VITE_FAL_AI_KEY,
      'Printful Available': !!import.meta.env.VITE_PRINTFUL_API_KEY,
      'N8n Available': !!import.meta.env.VITE_N8N_WEBHOOK_URL,
    });
    
    return health;
  }

  // Test environment configuration
  static checkEnvironment(): void {
    console.log('🌍 Environment Configuration:');
    
    const config = {
      'NODE_ENV': import.meta.env.NODE_ENV,
      'App Version': import.meta.env.VITE_APP_VERSION || '2.0.0',
      'Enhanced Generation': import.meta.env.VITE_ENABLE_ENHANCED_GENERATION,
      'Commerce Enabled': import.meta.env.VITE_ENABLE_COMMERCE,
      'Webhooks Enabled': import.meta.env.VITE_ENABLE_WEBHOOKS,
      'Gender Selection': import.meta.env.VITE_ENABLE_GENDER_SELECTION,
    };
    
    console.table(config);
    
    // Check API key configuration (without revealing keys)
    const apiStatus = {
      'Gemini API': import.meta.env.VITE_GEMINI_API_KEY ? '✅ Configured' : '❌ Missing',
      'fal.ai API': import.meta.env.VITE_FAL_AI_KEY ? '✅ Configured' : '❌ Missing',
      'Printful API': import.meta.env.VITE_PRINTFUL_API_KEY ? '✅ Configured' : '❌ Missing',
      'N8n Webhook': import.meta.env.VITE_N8N_WEBHOOK_URL ? '✅ Configured' : '❌ Missing',
      'Firebase': import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing',
    };
    
    console.log('🔑 API Configuration Status:');
    console.table(apiStatus);
  }

  // Test webhook connectivity
  static async testWebhooks(): Promise<boolean> {
    console.log('🔗 Testing webhook connectivity...');
    
    try {
      const result = await serviceManager.webhooks.testWebhook();
      
      if (result) {
        console.log('✅ Webhook test successful!');
      } else {
        console.log('❌ Webhook test failed - check N8n configuration');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Webhook test error:', error);
      return false;
    }
  }

  // Test image generation providers
  static testProviders(): void {
    console.log('🤖 Testing AI provider metrics...');
    
    const metrics = serviceManager.imageGeneration.getProviderMetrics();
    
    console.log('📊 Provider Performance Metrics:');
    console.table(metrics);
  }

  // Test commerce service
  static async testCommerce(): Promise<void> {
    console.log('🛍️ Testing commerce service...');
    
    try {
      // Test with mock data
      const mockImageData = {
        id: 'test-image-123',
        urls: {
          webDisplay: 'https://example.com/test.jpg',
          printReady: 'https://example.com/test-print.jpg',
          thumbnail: 'https://example.com/test-thumb.jpg',
          socialShare: 'https://example.com/test-social.jpg',
        },
        metadata: {
          printDPI: 300,
          commerceReady: true,
          provider: 'gemini' as const,
          generationTime: 5000,
          qualityScore: 8.5,
          styleName: 'Test Style',
          styleId: 'test-style'
        }
      };

      const mockUserInfo = {
        id: 'test-user-123',
        nickname: 'TestUser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const products = await serviceManager.commerce.createProductsForImage(mockImageData, mockUserInfo);
      
      console.log(`✅ Commerce test successful! Created ${products.length} products:`);
      products.forEach(product => {
        console.log(`  - ${product.name} (${product.type}): $${product.price}`);
      });
      
    } catch (error) {
      console.error('❌ Commerce test failed:', error);
    }
  }

  // Run comprehensive test suite
  static async runFullTestSuite(): Promise<void> {
    console.log('🧪 Running Full Test Suite...');
    console.log('=====================================');
    
    // Environment check
    this.checkEnvironment();
    console.log('');
    
    // Service health check
    await this.checkServiceHealth();
    console.log('');
    
    // Provider metrics
    this.testProviders();
    console.log('');
    
    // Webhook test
    await this.testWebhooks();
    console.log('');
    
    // Commerce test
    await this.testCommerce();
    console.log('');
    
    console.log('✅ Full test suite completed!');
    console.log('=====================================');
  }

  // Performance testing helper
  static startPerformanceMonitor(): void {
    if (typeof window !== 'undefined' && window.performance) {
      console.log('📊 Starting performance monitoring...');
      
      // Monitor memory usage
      setInterval(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          console.log('Memory Usage:', {
            used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
            total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
          });
        }
      }, 30000); // Every 30 seconds
    }
  }

  // Create test data
  static createTestData(): any {
    return {
      testUser: {
        id: 'test-user-' + Date.now(),
        nickname: 'TestUser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      },
      testImageDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      testStyles: [
        { id: 'm1', name: 'Drug Lord', gender: 'male' },
        { id: 'm2', name: 'Strip Club Owner', gender: 'male' },
        { id: 'f1', name: 'Drug Queen', gender: 'female' },
        { id: 'f2', name: 'Club Owner Diva', gender: 'female' }
      ]
    };
  }
}

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).TestUtils = TestUtils;
  console.log('🧪 TestUtils available globally! Try: TestUtils.runFullTestSuite()');
}

export default TestUtils;
