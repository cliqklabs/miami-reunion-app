// Image processing service for commerce-ready formats
// Addresses the TODO items in ImageGenerationService.ts

export interface ImageProcessingOptions {
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  width?: number;
  height?: number;
  dpi?: number;
}

export class ImageProcessingService {
  // Convert image to different formats and sizes
  static async processImageForCommerce(
    sourceImageUrl: string,
    styleName: string
  ): Promise<{
    webDisplay: string;
    printReady: string;
    thumbnail: string;
    socialShare: string;
  }> {
    try {
      // For now, create optimized versions using Canvas API
      // In production, you might want to use a service like Cloudinary or ImageKit
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            const results = {
              webDisplay: sourceImageUrl, // Original for web
              printReady: await this.createPrintVersion(img, canvas, ctx, styleName),
              thumbnail: await this.createThumbnail(img, canvas, ctx),
              socialShare: await this.createSocialVersion(img, canvas, ctx)
            };
            resolve(results);
          } catch (error) {
            console.error('Image processing failed:', error);
            // Fallback: use original image for all formats
            resolve({
              webDisplay: sourceImageUrl,
              printReady: sourceImageUrl,
              thumbnail: sourceImageUrl,
              socialShare: sourceImageUrl
            });
          }
        };

        img.onerror = () => {
          console.error('Failed to load image for processing');
          // Fallback: use original image for all formats
          resolve({
            webDisplay: sourceImageUrl,
            printReady: sourceImageUrl,
            thumbnail: sourceImageUrl,
            socialShare: sourceImageUrl
          });
        };

        img.src = sourceImageUrl;
      });
    } catch (error) {
      console.error('Image processing service error:', error);
      // Fallback: return original image for all formats
      return {
        webDisplay: sourceImageUrl,
        printReady: sourceImageUrl,
        thumbnail: sourceImageUrl,
        socialShare: sourceImageUrl
      };
    }
  }

  private static async createPrintVersion(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    styleName: string
  ): Promise<string> {
    // Create high-resolution version for printing (300 DPI equivalent)
    const printWidth = 2400; // ~8 inches at 300 DPI
    const printHeight = 3000; // ~10 inches at 300 DPI
    
    canvas.width = printWidth;
    canvas.height = printHeight;
    
    // Scale image to fit while maintaining aspect ratio
    const scale = Math.min(printWidth / img.width, printHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (printWidth - scaledWidth) / 2;
    const y = (printHeight - scaledHeight) / 2;
    
    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, printWidth, printHeight);
    
    // Draw scaled image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Add subtle watermark for print version
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.textAlign = 'center';
    ctx.fillText(`Miami Alter Ego - ${styleName}`, printWidth / 2, printHeight - 50);
    
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  private static async createThumbnail(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): Promise<string> {
    // Create thumbnail (300x300)
    const thumbSize = 300;
    canvas.width = thumbSize;
    canvas.height = thumbSize;
    
    // Create square crop from center
    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    
    ctx.drawImage(img, sx, sy, size, size, 0, 0, thumbSize, thumbSize);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  private static async createSocialVersion(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): Promise<string> {
    // Create 1080x1080 square for social media
    const socialSize = 1080;
    canvas.width = socialSize;
    canvas.height = socialSize;
    
    // Create square crop from center with gradient background
    const gradient = ctx.createLinearGradient(0, 0, socialSize, socialSize);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#581c87');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, socialSize, socialSize);
    
    // Scale and center the image
    const scale = Math.min(socialSize * 0.8 / img.width, socialSize * 0.8 / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (socialSize - scaledWidth) / 2;
    const y = (socialSize - scaledHeight) / 2;
    
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Add Miami branding
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText('MIAMI ALTER EGO', socialSize / 2, socialSize - 60);
    ctx.fillText('MIAMI ALTER EGO', socialSize / 2, socialSize - 60);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  // Alternative: Use external service for image processing
  static async processWithCloudinary(
    sourceImageUrl: string,
    cloudinaryUrl: string
  ): Promise<{
    webDisplay: string;
    printReady: string;
    thumbnail: string;
    socialShare: string;
  }> {
    // If using Cloudinary or similar service
    const baseUrl = sourceImageUrl.replace(/^https?:\/\//, '');
    
    return {
      webDisplay: `${cloudinaryUrl}/image/fetch/w_800,h_800,c_fit,q_auto,f_auto/${baseUrl}`,
      printReady: `${cloudinaryUrl}/image/fetch/w_2400,h_3000,c_fit,q_95,f_jpg,dpr_3.0/${baseUrl}`,
      thumbnail: `${cloudinaryUrl}/image/fetch/w_300,h_300,c_fill,q_auto,f_auto/${baseUrl}`,
      socialShare: `${cloudinaryUrl}/image/fetch/w_1080,h_1080,c_fill,q_auto,f_auto,b_rgb:0f172a/${baseUrl}`
    };
  }
}

export default ImageProcessingService;
