// Image validation and processing utilities
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  processedFile?: File;
  originalSize?: number;
  processedSize?: number;
}

export const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DIMENSION = 2048; // Max width/height
export const COMPRESSION_QUALITY = 0.8; // JPEG compression quality

/**
 * Validates and processes an uploaded image file
 */
export async function validateAndProcessImage(file: File): Promise<ImageValidationResult> {
  // Check file type by MIME type and extension
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  
  const isValidMimeType = SUPPORTED_FORMATS.includes(file.type.toLowerCase());
  const isValidExtension = supportedExtensions.includes(fileExtension || '');
  
  if (!isValidMimeType && !isValidExtension) {
    return {
      isValid: false,
      error: `Unsupported file format. Please use: JPG, PNG, WebP, HEIC, or HEIF files`
    };
  }

  // Check file size before processing
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    };
  }

  try {
    // Check if it's a HEIC/HEIF file
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension === 'heic' || fileExtension === 'heif') {
      return {
        isValid: false,
        error: `HEIC/HEIF files need to be converted first. Please convert to JPG or PNG using your phone's export feature or an online converter, then try again.`
      };
    }
    
    // Process the image
    const processedFile = await processImage(file);
    
    return {
      isValid: true,
      processedFile,
      originalSize: file.size,
      processedSize: processedFile.size
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Processes an image file - resize, compress, and convert to optimal format
 */
async function processImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = calculateDimensions(img.width, img.height, MAX_DIMENSION);
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file
            const processedFile = new File(
              [blob], 
              `processed_${file.name.replace(/\.[^/.]+$/, '.jpg')}`, // Convert to .jpg
              { type: 'image/jpeg' }
            );

            resolve(processedFile);
          },
          'image/jpeg',
          COMPRESSION_QUALITY
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(originalWidth: number, originalHeight: number, maxDimension: number) {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio)
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension
    };
  }
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
