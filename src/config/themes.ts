// Theme-specific content for the Miami Reunion app - Enhanced with Gender Support
export const CURRENT_THEME = 'miami';

export const THEMES = {
  miami: {
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vice (literally)",
    genderSelection: true,
    styles: {
      // Male styles (legacy keys preserved for backward compatibility)
      style1: {
        id: "style1",
        name: "Drug Lord",
        description: "Sleek Miami kingpin with '80s swagger",
        prompt: "Transform into a Miami cartel boss: crisp expensive white linen suit, heavy gold chains, bold confident and powerfulstance, luxurious mansion with palm trees in the background, dramatic golden hour lighting, hint of hazy cigar smoke atmosphere, photorealistic portrait style, cinematic style, 4k",
        gender: "male",
        referenceImages: ["/reference-images/style1/ref-1.jpg", "/reference-images/style1/ref-2.jpg"]
      },
      style2: {
        id: "style2",
        name: "Strip Club Owner",
        description: "Making it rain since '85",
        prompt: "Transform into a Miami strip club owner: flashy silk suit with unbuttoned shirt, thick gold chains and rings, neon club lighting in background, champagne bottles and cash scattered around, confident swagger pose, 1980s Miami nightlife aesthetic, photorealistic portrait style",
        gender: "male",
        referenceImages: ["/reference-images/style2/ref-1.jpg", "/reference-images/style2/ref-2.jpg"]
      },
      style3: {
        id: "style3",
        name: "Cocaine Cowboy",
        description: "80s Miami dealer vibes",
        prompt: "Transform into a 1980s Miami cocaine cowboy: pastel blazer over open shirt, aviator sunglasses, slicked back hair, speedboat or Ferrari in background, neon Vice aesthetic, Miami skyline at sunset, confident dealer swagger, retro film grain effect, photorealistic portrait style",
        gender: "male",
        referenceImages: ["/reference-images/style3/ref-1.jpg", "/reference-images/style3/ref-2.jpg"]
      },
      style4: {
        id: "style4",
        name: "Sugar Daddy",
        description: "Italian chic, over-the-top sophistication",
        prompt: "Transform into a flamboyant Miami sugar daddy: impeccably tailored Gucci silk suit with bold floral patterns, vibrant ascot tied with flair, designer sunglasses with gold accents, slicked-back silver hair, exuding confident charisma, luxurious oceanfront villa with marble columns and infinity pool, sleek yacht and exotic sports car in the background, surrounded by tropical cocktails and high-end fashion accessories, opulent Italian chic aesthetic, dramatic sunset lighting, photorealistic portrait style",
        gender: "male",
        referenceImages: ["/reference-images/style4/ref-1.jpg", "/reference-images/style4/ref-2.jpg"]
      },
      style5: {
        id: "style5",
        name: "Beach Gigolo",
        description: "Speedo tan lines optional",
        prompt: "Transform into a Miami beach gigolo: perfect bronze tan, minimal beach attire or colorful speedo, gold chains catching sunlight, beach club cabana background, surrounded by tropical drinks and admirers, oiled muscular physique, confident beach pose, photorealistic portrait style",
        gender: "male",
        referenceImages: ["/reference-images/style5/ref-1.jpg", "/reference-images/style5/ref-2.jpg"]
      },
      
      // Female styles (new additions)
      style6: {
        id: "style6",
        name: "Drug Queen",
        description: "Powerful Miami cartel boss with fierce confidence",
        prompt: "Transform into a Miami cartel queen: crisp expensive white linen suit, heavy gold chains, bold confident and powerful stance, luxurious mansion with palm trees in the background, dramatic golden hour lighting, hint of hazy atmosphere, photorealistic portrait style, cinematic style, 4k",
        gender: "female",
        referenceImages: []
      },
      style7: {
        id: "style7",
        name: "Club Owner Diva",
        description: "Running the hottest spots in Miami",
        prompt: "Transform into a glamorous Miami club owner: stunning sequined dress or designer power outfit, bold statement jewelry, perfect makeup and hair, neon club lighting background, champagne and VIP area setting, confident boss energy, 1980s Miami nightlife aesthetic, photorealistic portrait style",
        gender: "female",
        referenceImages: []
      },
      style8: {
        id: "style8",
        name: "Vice Detective",
        description: "80s Miami undercover elegance",
        prompt: "Transform into a 1980s Miami Vice detective: pastel blazer, designer sunglasses, Miami skyline backdrop, convertible sports car, neon aesthetic, retro film grain effect, photorealistic portrait style",
        gender: "female",
        referenceImages: []
      },
      style9: {
        id: "style9",
        name: "Sugar Mama",
        description: "Sophisticated wealth and Italian elegance",
        prompt: "Transform into an elegant Miami sugar mama: designer silk dress, exquisite jewelry, luxury oceanfront villa background with yacht, Italian chic aesthetic, dramatic sunset lighting, photorealistic portrait style",
        gender: "female",
        referenceImages: []
      },
      style10: {
        id: "style10",
        name: "Beach Goddess",
        description: "Miami beach royalty",
        prompt: "Transform into a Miami beach goddess: elegant beach attire, designer sunglasses and jewelry, luxury beach club cabana background, tropical drinks, confident beach pose, golden hour lighting, photorealistic portrait style",
        gender: "female",
        referenceImages: []
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

// Gender-aware helper functions
export const getStylesForGender = (gender: 'male' | 'female' | 'non-binary') => {
  const theme = getCurrentTheme();
  
  if (gender === 'non-binary') {
    return theme.styles; // Return all styles
  }
  
  // Filter styles by gender
  const filteredStyles = {};
  Object.entries(theme.styles).forEach(([key, style]) => {
    if (style.gender === gender) {
      filteredStyles[key] = style;
    }
  });
  
  return filteredStyles;
};

// Get style by name (handles both legacy and new styles)
export const getStyleByName = (styleName: string) => {
  const theme = getCurrentTheme();
  return Object.entries(theme.styles).find(([key, style]) => style.name === styleName);
};

// Get all male styles (for backward compatibility)
export const getMaleStyles = () => getStylesForGender('male');

// Get all female styles
export const getFemaleStyles = () => getStylesForGender('female');

// Check if theme supports gender selection
export const themeSupportsGenderSelection = () => {
  return getCurrentTheme().genderSelection || false;
};