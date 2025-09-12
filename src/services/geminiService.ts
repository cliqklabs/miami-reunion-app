import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


// --- Helper Functions ---

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param styleName The style name (e.g., "Kingpin", "Party Bro").
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(styleName: string): string {
    const stylePrompts: Record<string, string> = {
        // Miami fallbacks
        "Drug Lord": "Create a professional photograph of the person as a sophisticated Miami business executive in an expensive suit with a confident pose and luxury Miami backdrop.",
        "Strip Club Owner": "Create a photograph of the person as a Miami nightlife entrepreneur with flashy designer clothes, club lighting, and gold accessories.",
        "Cocaine Cowboy": "Create a photograph of the person in the classic 1980s Miami Vice style with pastel suit, aviator sunglasses, and neon lights.",
        "Sugar Daddy": "Create a photograph of the person as a Miami luxury lifestyle enthusiast with designer suit, sunglasses, and oceanfront villa backdrop.",
        "Beach Gigolo": "Create a photograph of the person in casual Miami beach style with tropical shirt, sunglasses, and beach club backdrop.",
        
        // Ibiza fallbacks
        "Selfie Influencer": "Create a photograph of the person as a social media content creator with stylish outfit, sunglasses, and luxury pool backdrop.",
        "Club Siren": "Create a photograph of the person as a fashionable party-goer with trendy outfit and vibrant nightclub lighting backdrop.",
        "Boho Hippie": "Create a photograph of the person in bohemian style with flowing clothes, natural accessories, and beach sunset backdrop.",
        "Wannabe Shaman": "Create a photograph of the person in spiritual retreat style with natural clothing and peaceful outdoor setting.",
        "Lost Tourist": "Create a photograph of the person as a vacation traveler with casual clothes and Mediterranean island backdrop.",
        "Party Bro": "Create a photograph of the person as an energetic party enthusiast with casual beach attire and festival lighting backdrop.",
        "DJ Wannabe": "Create a photograph of the person as a music enthusiast with trendy outfit and electronic music equipment backdrop.",
        "Yacht Playboy": "Create a photograph of the person as a luxury lifestyle enthusiast with designer casual wear and boat marina backdrop.",
        "Spiritual Dude": "Create a photograph of the person in relaxed meditation style with comfortable clothing and peaceful nature backdrop.",
        "Rave Veteran": "Create a photograph of the person as a music festival enthusiast with casual party attire and concert lighting backdrop."
    };

    return stylePrompts[styleName] || `Create a photorealistic image of the person in ${styleName} style.`;
}

/**
 * Extracts the style name from a prompt string.
 * @param prompt The original prompt.
 * @returns The style name or null if not found.
 */
function extractStyleName(prompt: string): string | null {
    const styleNames = [
        // Miami styles
        "Drug Lord", "Strip Club Owner", "Cocaine Cowboy", "Sugar Daddy", "Beach Gigolo",
        // Ibiza styles
        "Selfie Influencer", "Club Siren", "Boho Hippie", "Wannabe Shaman", "Lost Tourist",
        "Party Bro", "DJ Wannabe", "Yacht Playboy", "Spiritual Dude", "Rave Veteran"
    ];
    for (const styleName of styleNames) {
        if (prompt.includes(styleName)) {
            return styleName;
        }
    }
    return null;
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: GenerateContentResponse): string {
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new Error(`The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`);
}

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
const pendingRequests = new Set<string>();

/**
 * A wrapper for the Gemini API call that includes rate limiting and retry mechanism.
 * @param imagePart The image part of the request payload.
 * @param textPart The text part of the request payload.
 * @param requestId A unique identifier for this request to prevent duplicates.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(imagePart: object, textPart: object, requestId?: string): Promise<GenerateContentResponse> {
    // Prevent duplicate requests
    if (requestId && pendingRequests.has(requestId)) {
        throw new Error('Request already in progress');
    }
    
    if (requestId) {
        pendingRequests.add(requestId);
    }

    try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
            console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastRequestTime = Date.now();

        const maxRetries = 3;
        const initialDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [imagePart, textPart] },
                });
                return response;
            } catch (error) {
                console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
                const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
                const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');
                const isRateLimited = errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT');

                if ((isInternalError || isRateLimited) && attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(2, attempt - 1) + (isRateLimited ? 3000 : 0);
                    console.log(`${isRateLimited ? 'Rate limit' : 'Internal error'} detected. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error; // Re-throw if not a retriable error or if max retries are reached.
            }
        }
        // This should be unreachable due to the loop and throw logic above.
        throw new Error("Gemini API call failed after all retries.");
    } finally {
        if (requestId) {
            pendingRequests.delete(requestId);
        }
    }
}


/**
 * Generates a Miami-styled image from a source image and a prompt.
 * It includes a fallback mechanism for prompts that might be blocked in certain regions.
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param prompt The prompt to guide the image generation.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateMiamiImage(imageDataUrl: string, prompt: string, requestId?: string): Promise<string> {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
  }
  const [, mimeType, base64Data] = match;

    const imagePart = {
        inlineData: { mimeType, data: base64Data },
    };

    // --- First attempt with the original prompt ---
    try {
        console.log("Attempting generation with original prompt...");
        const textPart = { text: prompt };
        const response = await callGeminiWithRetry(imagePart, textPart, requestId);
        return processGeminiResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const isNoImageError = errorMessage.includes("The AI model responded with text instead of an image");
        const isDuplicateRequest = errorMessage.includes("Request already in progress");

        if (isDuplicateRequest) {
            throw new Error("Please wait - image generation is already in progress for this style.");
        }

        if (isNoImageError) {
            console.warn("Original prompt was likely blocked. Trying a fallback prompt.");
            const styleName = extractStyleName(prompt);
            if (!styleName) {
                console.error("Could not extract style name from prompt, cannot use fallback.");
                throw new Error("Content policy violation: This prompt cannot be processed. Please try a different style.");
            }

            // --- Second attempt with the fallback prompt ---
            try {
                const fallbackPrompt = getFallbackPrompt(styleName);
                console.log(`Attempting generation with fallback prompt for ${styleName}...`);
                const fallbackTextPart = { text: fallbackPrompt };
                const fallbackRequestId = requestId ? `${requestId}-fallback` : undefined;
                const fallbackResponse = await callGeminiWithRetry(imagePart, fallbackTextPart, fallbackRequestId);
                return processGeminiResponse(fallbackResponse);
            } catch (fallbackError) {
                console.error("Fallback prompt also failed.", fallbackError);
                const finalErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`Generation failed: This style may be temporarily unavailable. Please try again later or try a different style.`);
            }
        } else {
            // This is for other errors, like a final internal server error after retries.
            console.error("An unrecoverable error occurred during image generation.", error);
            throw new Error(`Image generation temporarily unavailable. Please try again in a moment.`);
        }
    }
}
