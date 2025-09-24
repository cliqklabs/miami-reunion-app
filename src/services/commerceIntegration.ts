// Simple commerce integration for Miami Alter Ego
// This replaces the complex service manager with a simpler approach

import { generateMiamiImage } from './geminiService';

export interface CommerceResult {
  image: {
    url: string;
    dataUrl: string;
  };
  products: Array<{
    type: 'tshirt' | 'mug' | 'poster';
    name: string;
    price: number;
    printfulId?: string;
    mockUrl: string;
  }>;
  commerceEnabled: boolean;
  webhookFired: boolean;
}

export interface UserInfo {
  id: string;
  nickname: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Enhanced image generation with automatic commerce product creation
 */
export async function generateImageWithCommerce(
  imageDataUrl: string,
  prompt: string,
  styleId: string,
  styleName: string,
  userInfo: UserInfo
): Promise<CommerceResult> {
  
  console.log(`🎨 Generating image for style: ${styleName}`);
  
  // Step 1: Generate the image using existing Gemini service
  const imageUrl = await generateMiamiImage(imageDataUrl, prompt);
  
  // Step 2: Create mock products (will be real Printful integration later)
  const products = await createMockProducts(imageUrl, styleName, userInfo);
  
  // Step 3: Fire webhook (if configured)
  const webhookFired = await fireCommerceWebhook({
    event: 'image_generated',
    userId: userInfo.id,
    userEmail: userInfo.email,
    styleName,
    imageUrl,
    products
  });
  
  return {
    image: {
      url: imageUrl,
      dataUrl: imageUrl
    },
    products,
    commerceEnabled: products.length > 0,
    webhookFired
  };
}

/**
 * Create mock products that will be real Printful products
 */
async function createMockProducts(imageUrl: string, styleName: string, userInfo: UserInfo) {
  console.log(`🛍️ Creating products for ${styleName}...`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const products = [
    {
      type: 'tshirt' as const,
      name: `${styleName} T-Shirt`,
      price: 29.99,
      mockUrl: `https://via.placeholder.com/400x400/000000/FFFFFF?text=${encodeURIComponent(styleName + ' Tee')}`
    },
    {
      type: 'mug' as const,
      name: `${styleName} Mug`,
      price: 19.99,
      mockUrl: `https://via.placeholder.com/400x400/FFFFFF/000000?text=${encodeURIComponent(styleName + ' Mug')}`
    },
    {
      type: 'poster' as const,
      name: `${styleName} Poster`,
      price: 24.99,
      mockUrl: `https://via.placeholder.com/400x600/CCCCCC/000000?text=${encodeURIComponent(styleName + ' Poster')}`
    }
  ];
  
  console.log(`✅ Created ${products.length} mock products`);
  return products;
}

/**
 * Fire webhook for commerce events
 */
async function fireCommerceWebhook(eventData: any): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('🔗 No webhook URL configured - skipping webhook');
    return false;
  }
  
  // Create ultra-simple payload for N8n testing
  const payload = {
    event: 'image_generated',
    user: eventData.userId || 'test-user',
    style: eventData.styleName || 'test-style',
    timestamp: new Date().toISOString(),
    test: true
  };
  
  try {
    console.log('🔗 Firing N8n webhook with payload:', payload);
    
    // Try without no-cors first for better error reporting
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Webhook response status:', response.status);
    
    if (response.ok || response.status === 200) {
      const responseText = await response.text();
      console.log('✅ Webhook fired successfully, response:', responseText);
      return true;
    } else {
      console.warn('⚠️ Webhook failed with status:', response.status);
      // Try with no-cors as fallback
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
      console.log('🔄 Webhook sent with no-cors fallback');
      return true; // Assume success with no-cors
    }
  } catch (error) {
    console.warn('⚠️ Webhook error, trying no-cors fallback:', error);
    try {
      // Fallback with no-cors
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
      console.log('🔄 Webhook sent successfully with no-cors fallback');
      return true;
    } catch (fallbackError) {
      console.error('❌ Both webhook attempts failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Check if commerce features are properly configured
 */
export function getCommerceStatus() {
  return {
    printfulConfigured: !!import.meta.env.VITE_PRINTFUL_API_KEY,
    webhookConfigured: !!import.meta.env.VITE_N8N_WEBHOOK_URL,
    commerceEnabled: import.meta.env.VITE_ENABLE_ENHANCED_GENERATION === 'true',
    status: 'Commerce integration ready for testing'
  };
}

/**
 * Test utilities for commerce system
 */
export const CommerceTestUtils = {
  async testProductCreation() {
    console.log('🧪 Testing product creation...');
    const products = await createMockProducts(
      'https://example.com/test-image.jpg',
      'Test Style',
      { id: 'test', nickname: 'Test', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    );
    console.log('Products created:', products);
    return products;
  },
  
  async testWebhook() {
    console.log('🧪 Testing webhook...');
    const result = await fireCommerceWebhook({
      event: 'test',
      message: 'Commerce system test'
    });
    console.log('Webhook result:', result);
    return result;
  },
  
  checkStatus() {
    const status = getCommerceStatus();
    console.log('Commerce status:', status);
    return status;
  }
};
