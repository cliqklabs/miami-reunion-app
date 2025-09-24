import { GeneratedImageOutput } from './ImageGenerationService';

// Commerce interfaces following REFACTORING_PLAN.md structure
export interface UserInfo {
  id: string;
  nickname: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CommerceProduct {
  id: string;
  name: string;
  type: 'tshirt' | 'mug' | 'poster';
  price: number;
  currency: string;
  printfulProductId: string;
  printfulVariantId: number;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  sizes?: string[];
  mockupUrl?: string;
}

export interface OrderData {
  products: Array<{
    productId: string;
    variantId: number;
    quantity: number;
    size?: string;
  }>;
  customer: {
    name: string;
    email: string;
    address: {
      name: string;
      address1: string;
      city: string;
      state_code: string;
      country_code: string;
      zip: string;
    };
  };
  total: number;
  currency: string;
  eventId?: string;
  hostEmail?: string;
}

export interface OrderResult {
  success: boolean;
  orderId: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  hostPayout: number;
  platformRevenue: number;
  error?: string;
}

export interface ICommerceService {
  createProductsForImage(imageData: GeneratedImageOutput, userInfo: UserInfo): Promise<CommerceProduct[]>;
  processOrder(orderData: OrderData): Promise<OrderResult>;
  getProductById(productId: string): Promise<CommerceProduct | null>;
  updateProductStatus(productId: string, status: string): Promise<boolean>;
}

// Printful API interfaces based on their documentation
interface PrintfulProduct {
  id: number;
  name: string;
  type: string;
  description: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  options: Array<{
    id: string;
    title: string;
    type: string;
    values: Array<{[key: string]: any}>;
  }>;
}

interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

interface PrintfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  warehouse_product_variant_id: number;
  retail_price: string;
  sku: string;
  currency: string;
  product: PrintfulProduct;
  files: Array<{
    id: number;
    type: string;
    hash: string;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    x: number;
    y: number;
    scale: number;
    visible: boolean;
  }>;
  options: Array<{
    id: string;
    value: string;
  }>;
  is_ignored: boolean;
}

export class PrintfulCommerceService implements ICommerceService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.printful.com';
  private readonly hostRevenueShare = 0.30; // 30% to host, 70% to platform
  private webhookService: any; // Will be injected

  constructor(webhookService?: any) {
    this.apiKey = import.meta.env.VITE_PRINTFUL_API_KEY || '';
    this.webhookService = webhookService;
    
    if (!this.apiKey) {
      console.warn('VITE_PRINTFUL_API_KEY not configured - commerce functionality will be limited');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    if (!this.apiKey) {
      throw new Error('Printful API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Printful API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Printful API request failed:', error);
      throw error;
    }
  }

  async createProductsForImage(imageData: GeneratedImageOutput, userInfo: UserInfo): Promise<CommerceProduct[]> {
    try {
      console.log(`Creating products for ${userInfo.nickname}'s ${imageData.metadata.styleName}`);
      
      const products: CommerceProduct[] = [];
      
      // Define product variants to create based on REFACTORING_PLAN.md
      const productVariants = [
        { id: 71, type: 'tshirt' as const, name: 'Unisex T-shirt', price: 24.95 },
        { id: 19, type: 'mug' as const, name: 'White Mug', price: 14.95 },
        { id: 167, type: 'poster' as const, name: 'Poster 18x24"', price: 19.95 }
      ];

      // Create sync product
      const syncProductData = {
        sync_product: {
          name: `${imageData.metadata.styleName} - ${userInfo.nickname}`,
          thumbnail: imageData.urls.printReady,
          external_id: `${imageData.id}-${userInfo.id}`
        },
        sync_variants: productVariants.map(variant => ({
          id: variant.id,
          external_id: `${imageData.id}-${variant.type}`,
          retail_price: variant.price.toString(),
          files: [{
            url: imageData.urls.printReady,
            type: variant.type === 'poster' ? 'default' : 'front'
          }]
        }))
      };

      // Create products in Printful
      const result = await this.makeRequest('/sync/products', 'POST', syncProductData);
      
      if (result?.result?.sync_product) {
        const syncProduct = result.result.sync_product;
        const syncVariants = result.result.sync_variants || [];

        // Create our product records
        for (let i = 0; i < productVariants.length; i++) {
          const variant = productVariants[i];
          const syncVariant = syncVariants[i];
          
          if (syncVariant) {
            const product: CommerceProduct = {
              id: `${imageData.id}-${variant.type}`,
              name: `${variant.name} - ${imageData.metadata.styleName}`,
              type: variant.type,
              price: variant.price,
              currency: 'USD',
              printfulProductId: syncProduct.id.toString(),
              printfulVariantId: syncVariant.id,
              imageUrl: imageData.urls.webDisplay,
              thumbnailUrl: imageData.urls.thumbnail,
              description: `${userInfo.nickname}'s ${imageData.metadata.styleName} alter ego on a premium ${variant.name.toLowerCase()}`,
              mockupUrl: syncVariant.files?.[0]?.preview_url
            };

            if (variant.type === 'tshirt') {
              product.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
            }

            products.push(product);
          }
        }

        // Trigger automation webhook
        if (this.webhookService) {
          await this.webhookService.emit({
            type: 'products_created',
            data: {
              imageId: imageData.id,
              userId: userInfo.id,
              userNickname: userInfo.nickname,
              styleName: imageData.metadata.styleName,
              productCount: products.length,
              printfulProductId: syncProduct.id,
              products: products.map(p => ({ id: p.id, type: p.type, price: p.price }))
            }
          });
        }

        console.log(`Successfully created ${products.length} products for ${userInfo.nickname}'s ${imageData.metadata.styleName}`);
      }

      return products;
    } catch (error) {
      console.error('Failed to create products:', error);
      
      // Return mock products in development/demo mode
      if (!this.apiKey) {
        return this.createMockProducts(imageData, userInfo);
      }
      
      throw error;
    }
  }

  private createMockProducts(imageData: GeneratedImageOutput, userInfo: UserInfo): CommerceProduct[] {
    console.log('Creating mock products for development/demo mode');
    
    const mockProducts: CommerceProduct[] = [
      {
        id: `${imageData.id}-tshirt`,
        name: `Unisex T-shirt - ${imageData.metadata.styleName}`,
        type: 'tshirt',
        price: 24.95,
        currency: 'USD',
        printfulProductId: 'mock-product-1',
        printfulVariantId: 71,
        imageUrl: imageData.urls.webDisplay,
        thumbnailUrl: imageData.urls.thumbnail,
        description: `${userInfo.nickname}'s ${imageData.metadata.styleName} alter ego on a premium unisex t-shirt`,
        sizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        id: `${imageData.id}-mug`,
        name: `White Mug - ${imageData.metadata.styleName}`,
        type: 'mug',
        price: 14.95,
        currency: 'USD',
        printfulProductId: 'mock-product-2',
        printfulVariantId: 19,
        imageUrl: imageData.urls.webDisplay,
        thumbnailUrl: imageData.urls.thumbnail,
        description: `${userInfo.nickname}'s ${imageData.metadata.styleName} alter ego on a premium white mug`
      },
      {
        id: `${imageData.id}-poster`,
        name: `Poster 18x24" - ${imageData.metadata.styleName}`,
        type: 'poster',
        price: 19.95,
        currency: 'USD',
        printfulProductId: 'mock-product-3',
        printfulVariantId: 167,
        imageUrl: imageData.urls.webDisplay,
        thumbnailUrl: imageData.urls.thumbnail,
        description: `${userInfo.nickname}'s ${imageData.metadata.styleName} alter ego on a premium 18x24" poster`
      }
    ];

    return mockProducts;
  }

  async processOrder(orderData: OrderData): Promise<OrderResult> {
    try {
      console.log('Processing order:', orderData);

      // Calculate payouts
      const hostPayout = orderData.total * this.hostRevenueShare;
      const platformRevenue = orderData.total * (1 - this.hostRevenueShare);

      if (!this.apiKey) {
        // Mock order processing for development
        const mockOrder: OrderResult = {
          success: true,
          orderId: `mock-order-${Date.now()}`,
          trackingNumber: 'MOCK123456789',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          hostPayout,
          platformRevenue
        };

        // Trigger mock automation
        if (this.webhookService) {
          await this.webhookService.emit({
            type: 'order_placed',
            data: {
              orderId: mockOrder.orderId,
              hostPayout,
              platformRevenue,
              customerName: orderData.customer.name,
              eventId: orderData.eventId,
              hostEmail: orderData.hostEmail,
              total: orderData.total,
              products: orderData.products
            }
          });
        }

        return mockOrder;
      }

      // Real Printful order processing
      const printfulOrderData = {
        recipient: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          address1: orderData.customer.address.address1,
          city: orderData.customer.address.city,
          state_code: orderData.customer.address.state_code,
          country_code: orderData.customer.address.country_code,
          zip: orderData.customer.address.zip
        },
        items: orderData.products.map(product => ({
          sync_variant_id: product.variantId,
          quantity: product.quantity,
          retail_price: (orderData.total / orderData.products.reduce((sum, p) => sum + p.quantity, 0)).toFixed(2)
        }))
      };

      const result = await this.makeRequest('/orders', 'POST', printfulOrderData);
      
      if (result?.result) {
        const order = result.result;
        
        const orderResult: OrderResult = {
          success: true,
          orderId: order.id.toString(),
          trackingNumber: order.tracking_number,
          estimatedDelivery: order.estimated_fulfillment,
          hostPayout,
          platformRevenue
        };

        // Trigger automation webhook
        if (this.webhookService) {
          await this.webhookService.emit({
            type: 'order_placed',
            data: {
              orderId: orderResult.orderId,
              hostPayout,
              platformRevenue,
              customerName: orderData.customer.name,
              eventId: orderData.eventId,
              hostEmail: orderData.hostEmail,
              total: orderData.total,
              trackingNumber: orderResult.trackingNumber,
              products: orderData.products
            }
          });
        }

        return orderResult;
      }

      throw new Error('Failed to create order in Printful');
    } catch (error) {
      console.error('Order processing failed:', error);
      return {
        success: false,
        orderId: '',
        hostPayout: 0,
        platformRevenue: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getProductById(productId: string): Promise<CommerceProduct | null> {
    try {
      // In a real implementation, this would fetch from your database
      // For now, return null as products are created on-demand
      return null;
    } catch (error) {
      console.error('Failed to get product:', error);
      return null;
    }
  }

  async updateProductStatus(productId: string, status: string): Promise<boolean> {
    try {
      // In a real implementation, this would update product status in your database
      console.log(`Product ${productId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Failed to update product status:', error);
      return false;
    }
  }

  // Get product catalog for a specific template/style
  async getAvailableProducts(): Promise<PrintfulProduct[]> {
    try {
      const result = await this.makeRequest('/products');
      return result?.result || [];
    } catch (error) {
      console.error('Failed to get available products:', error);
      return [];
    }
  }

  // Calculate pricing with host revenue share
  calculatePricing(basePrice: number): { hostPayout: number; platformRevenue: number; totalPrice: number } {
    const hostPayout = basePrice * this.hostRevenueShare;
    const platformRevenue = basePrice * (1 - this.hostRevenueShare);
    
    return {
      hostPayout,
      platformRevenue,
      totalPrice: basePrice
    };
  }
}

// Export singleton instance - will be injected with webhook service later
export const printfulCommerceService = new PrintfulCommerceService();
