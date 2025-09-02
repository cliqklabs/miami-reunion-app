// Theme-specific content for the Miami Reunion app
export const CURRENT_THEME = 'miami';

export const THEMES = {
  miami: {
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vibe",
    styles: {
      style1: {
        name: "Kingpin",
        description: "Sophisticated Miami business executive",
        prompt: "Professional Miami business executive in expensive suit, confident pose, luxury Miami backdrop, golden hour lighting, cinematic style, photorealistic",
        referenceImages: ["/reference-images/style1/ref-1.jpg", "/reference-images/style1/ref-2.jpg"]
      },
      style2: {
        name: "Vice",
        description: "Classic 80s Miami Vice aesthetic",
        prompt: "1980s Miami Vice aesthetic with pastel suit, aviator sunglasses, neon lights, retro film style, confident pose, photorealistic",
        referenceImages: ["/reference-images/style2/ref-1.jpg", "/reference-images/style2/ref-2.jpg"]
      },
      style3: {
        name: "Player",
        description: "Miami nightlife legend",
        prompt: "Flashy Miami nightlife style with designer clothes, club lighting, gold chains, confident pose, vibrant colors, photorealistic",
        referenceImages: ["/reference-images/style3/ref-1.jpg", "/reference-images/style3/ref-2.jpg"]
      },
      style4: {
        name: "Tourist",
        description: "Miami vacation vibes",
        prompt: "Casual Miami vacation style with Hawaiian shirt, sunglasses, beach backdrop, relaxed pose, tropical atmosphere, photorealistic",
        referenceImages: ["/reference-images/style4/ref-1.jpg", "/reference-images/style4/ref-2.jpg"]
      }
    },
    colors: {
      primary: "#06b6d4", // teal
      secondary: "#ec4899", // pink
      accent: "#f97316" // orange
    }
  }
};

// Helper function to get current theme data
export const getCurrentTheme = () => THEMES[CURRENT_THEME];
export const getStyleConfig = (styleId: string) => getCurrentTheme().styles[styleId as keyof typeof THEMES.miami.styles];
