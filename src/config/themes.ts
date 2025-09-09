// Theme-specific content for the Miami Reunion app
export const CURRENT_THEME = 'miami';

export const THEMES = {
  miami: {
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vice (literally)",
    styles: {
      style1: {
        name: "Drug Lord",
        description: "Sleek Miami kingpin with '80s swagger",
        prompt: "Transform into a Miami cartel boss: crisp expensive white linen suit, heavy gold chains, bold confident and powerfulstance, luxurious mansion with palm trees in the background, dramatic golden hour lighting, hint of hazy cigar smoke atmosphere, photorealistic portrait style, cinematic style, 4k",
        referenceImages: ["/reference-images/style1/ref-1.jpg", "/reference-images/style1/ref-2.jpg"]
      },
      style2: {
        name: "Strip Club Owner",
        description: "Making it rain since '85",
        prompt: "Transform into a Miami strip club owner: flashy silk suit with unbuttoned shirt, thick gold chains and rings, neon club lighting in background, champagne bottles and cash scattered around, confident swagger pose, 1980s Miami nightlife aesthetic, photorealistic portrait style",
        referenceImages: ["/reference-images/style2/ref-1.jpg", "/reference-images/style2/ref-2.jpg"]
      },
      style3: {
        name: "Cocaine Cowboy",
        description: "80s Miami dealer vibes",
        prompt: "Transform into a 1980s Miami cocaine cowboy: pastel blazer over open shirt, aviator sunglasses, slicked back hair, speedboat or Ferrari in background, neon Vice aesthetic, Miami skyline at sunset, confident dealer swagger, retro film grain effect, photorealistic portrait style",
        referenceImages: ["/reference-images/style3/ref-1.jpg", "/reference-images/style3/ref-2.jpg"]
      },
      style4: {
        name: "Sugar Daddy",
        description: "Italian chic, over-the-top sophistication",
        prompt: "Transform into a flamboyant Miami sugar daddy: impeccably tailored Gucci silk suit with bold floral patterns, vibrant ascot tied with flair, designer sunglasses with gold accents, slicked-back silver hair, exuding confident charisma, luxurious oceanfront villa with marble columns and infinity pool, sleek yacht and exotic sports car in the background, surrounded by tropical cocktails and high-end fashion accessories, opulent Italian chic aesthetic, dramatic sunset lighting, photorealistic portrait style",
        referenceImages: ["/reference-images/style4/ref-1.jpg", "/reference-images/style4/ref-2.jpg"]
      },
      style5: {
        name: "Beach Gigolo",
        description: "Speedo tan lines optional",
        prompt: "Transform into a Miami beach gigolo: perfect bronze tan, minimal beach attire or colorful speedo, gold chains catching sunlight, beach club cabana background, surrounded by tropical drinks and admirers, oiled muscular physique, confident beach pose, photorealistic portrait style",
        referenceImages: ["/reference-images/style5/ref-1.jpg", "/reference-images/style5/ref-2.jpg"]
      }
    },
    colors: {
      primary: "#06b6d4", // teal
      secondary: "#ec4899", // pink
      accent: "#f97316" // orange
    }
  }
};

// Helper functions
export const getCurrentTheme = () => THEMES[CURRENT_THEME];
export const getStyleConfig = (styleId) => getCurrentTheme().styles[styleId];
export const getAllStyles = () => Object.keys(getCurrentTheme().styles);