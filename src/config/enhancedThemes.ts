// Enhanced theme configuration based on reference patterns and REFACTORING_PLAN.md
// This extends the existing themes.ts with gender-aware styles and multi-event support

export type Gender = 'male' | 'female' | 'non-binary';

export interface StyleConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  gender: Gender;
  icon?: string;
  referenceImages?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface ThemeConfig {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  genderSelection: boolean;
  styles: Record<string, StyleConfig>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  backgroundClass?: string;
  logoUrl?: string;
}

// Enhanced Miami theme with gender-aware styles following reference patterns
export const ENHANCED_THEMES: Record<string, ThemeConfig> = {
  miami: {
    id: 'miami',
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vice (literally)",
    description: "Transform into a 1980s Miami character with AI-powered style generation",
    genderSelection: true,
    styles: {
      // Male styles (m1-m5)
      m1: {
        id: 'm1',
        name: "Drug Lord",
        description: "Sleek Miami kingpin with '80s swagger",
        prompt: "Transform into a Miami cartel boss: crisp expensive white linen suit, heavy gold chains, bold confident and powerful stance, luxurious mansion with palm trees in the background, dramatic golden hour lighting, hint of hazy cigar smoke atmosphere, photorealistic portrait style, cinematic style, 4k",
        gender: 'male',
        icon: "/icons/drug-lord-icon.png",
        tags: ['power', 'luxury', 'dangerous'],
        difficulty: 'medium'
      },
      m2: {
        id: 'm2',
        name: "Strip Club Owner",
        description: "Making it rain since '85",
        prompt: "Transform into a Miami strip club owner: flashy silk suit with unbuttoned shirt, thick gold chains and rings, neon club lighting in background, champagne bottles and cash scattered around, confident swagger pose, 1980s Miami nightlife aesthetic, photorealistic portrait style",
        gender: 'male',
        icon: "/icons/strip-club-owner-icon.png",
        tags: ['nightlife', 'flashy', 'money'],
        difficulty: 'hard'
      },
      m3: {
        id: 'm3',
        name: "Cocaine Cowboy",
        description: "80s Miami dealer vibes",
        prompt: "Transform into a 1980s Miami cocaine cowboy: pastel blazer over open shirt, aviator sunglasses, slicked back hair, speedboat or Ferrari in background, neon Vice aesthetic, Miami skyline at sunset, confident dealer swagger, retro film grain effect, photorealistic portrait style",
        gender: 'male',
        icon: "/icons/cocaine-cowboy-icon.png",
        tags: ['retro', 'dangerous', 'cool'],
        difficulty: 'medium'
      },
      m4: {
        id: 'm4',
        name: "Sugar Daddy",
        description: "Italian chic, over-the-top sophistication",
        prompt: "Transform into a flamboyant Miami sugar daddy: impeccably tailored Gucci silk suit with bold floral patterns, vibrant ascot tied with flair, designer sunglasses with gold accents, slicked-back silver hair, exuding confident charisma, luxurious oceanfront villa with marble columns and infinity pool, sleek yacht and exotic sports car in the background, surrounded by tropical cocktails and high-end fashion accessories, opulent Italian chic aesthetic, dramatic sunset lighting, photorealistic portrait style",
        gender: 'male',
        icon: "/icons/sugar-daddy-icon.png",
        tags: ['luxury', 'sophisticated', 'wealth'],
        difficulty: 'easy'
      },
      m5: {
        id: 'm5',
        name: "Beach Gigolo",
        description: "Speedo tan lines optional",
        prompt: "Transform into a Miami beach gigolo: perfect bronze tan, minimal beach attire or colorful speedo, gold chains catching sunlight, beach club cabana background, surrounded by tropical drinks and admirers, oiled muscular physique, confident beach pose, photorealistic portrait style",
        gender: 'male',
        icon: "/icons/beach-gigolo-icon.png",
        tags: ['beach', 'seductive', 'summer'],
        difficulty: 'hard'
      },
      
      // Female styles (f1-f5) - new additions based on reference patterns
      f1: {
        id: 'f1',
        name: "Drug Queen",
        description: "Powerful Miami cartel boss with fierce confidence",
        prompt: "Transform into a Miami cartel queen: elegant designer power suit in white or cream, statement gold jewelry and chains, fierce confident expression, luxury Miami penthouse background with city skyline, dramatic golden hour lighting, expensive handbag and accessories, photorealistic portrait style, cinematic lighting, 4k",
        gender: 'female',
        tags: ['power', 'luxury', 'dangerous'],
        difficulty: 'medium'
      },
      f2: {
        id: 'f2',
        name: "Club Owner Diva",
        description: "Running the hottest spots in Miami",
        prompt: "Transform into a glamorous Miami club owner: stunning sequined dress or designer power outfit, bold statement jewelry, perfect makeup and hair, neon club lighting background, champagne and VIP area setting, confident boss energy, 1980s Miami nightlife aesthetic, photorealistic portrait style",
        gender: 'female',
        tags: ['nightlife', 'glamour', 'boss'],
        difficulty: 'hard'
      },
      f3: {
        id: 'f3',
        name: "Vice Detective",
        description: "80s Miami undercover elegance",
        prompt: "Transform into a 1980s Miami Vice detective: chic pastel blazer over silk camisole, designer sunglasses, perfectly styled hair, Miami skyline backdrop, convertible sports car, confident detective pose, neon aesthetic, retro film grain effect, photorealistic portrait style",
        gender: 'female',
        tags: ['retro', 'cool', 'professional'],
        difficulty: 'medium'
      },
      f4: {
        id: 'f4',
        name: "Sugar Mama",
        description: "Sophisticated wealth and Italian elegance",
        prompt: "Transform into an elegant Miami sugar mama: designer silk dress or chic power suit, exquisite jewelry and accessories, perfectly styled hair, luxury oceanfront villa background with yacht, expensive wine and designer bags, sophisticated confident pose, Italian chic aesthetic, dramatic sunset lighting, photorealistic portrait style",
        gender: 'female',
        tags: ['luxury', 'sophisticated', 'wealth'],
        difficulty: 'easy'
      },
      f5: {
        id: 'f5',
        name: "Beach Goddess",
        description: "Miami beach royalty",
        prompt: "Transform into a Miami beach goddess: stunning bikini or elegant beach cover-up, perfect tan and beach waves, designer sunglasses and jewelry, luxury beach club cabana background, tropical drinks and ocean view, confident beach pose, golden hour lighting, photorealistic portrait style",
        gender: 'female',
        tags: ['beach', 'glamour', 'summer'],
        difficulty: 'medium'
      }
    },
    colors: {
      primary: "#06b6d4", // teal
      secondary: "#ec4899", // pink
      accent: "#f97316" // orange
    },
    backgroundClass: "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900",
    logoUrl: "/logo/miami_logo_2025.png"
  },

  // Future themes for expansion
  wedding: {
    id: 'wedding',
    title: "Create Your Wedding Alter Ego",
    subtitle: "Choose your wedding vibe",
    description: "Transform into the perfect wedding character for any celebration",
    genderSelection: true,
    styles: {
      m1: {
        id: 'm1',
        name: "Dapper Groom",
        description: "Classic elegance meets modern style",
        prompt: "Transform into a dapper groom: perfectly tailored black or navy tuxedo, crisp white shirt, elegant bow tie or necktie, boutonniere, confident pose, romantic wedding venue background, soft romantic lighting, photorealistic portrait style",
        gender: 'male',
        tags: ['elegant', 'classic', 'romantic'],
        difficulty: 'easy'
      },
      m2: {
        id: 'm2',
        name: "Party Groomsman",
        description: "Life of the wedding party",
        prompt: "Transform into a fun groomsman: stylish suit with personality, loosened tie, party atmosphere, champagne or cocktail in hand, dance floor or party background, celebratory mood, photorealistic portrait style",
        gender: 'male',
        tags: ['fun', 'party', 'celebration'],
        difficulty: 'medium'
      },
      f1: {
        id: 'f1',
        name: "Elegant Bride",
        description: "Timeless bridal beauty",
        prompt: "Transform into an elegant bride: stunning white wedding dress, beautiful veil, perfect bridal makeup and hair, bouquet of flowers, romantic pose, beautiful wedding venue background, soft romantic lighting, photorealistic portrait style",
        gender: 'female',
        tags: ['elegant', 'romantic', 'classic'],
        difficulty: 'easy'
      },
      f2: {
        id: 'f2',
        name: "Boho Bride",
        description: "Free-spirited wedding style",
        prompt: "Transform into a bohemian bride: flowy wedding dress with lace details, flower crown or loose hair with flowers, natural makeup, outdoor wedding setting, garden or beach background, relaxed confident pose, photorealistic portrait style",
        gender: 'female',
        tags: ['boho', 'natural', 'free-spirited'],
        difficulty: 'medium'
      }
    },
    colors: {
      primary: "#f8fafc", // white
      secondary: "#f1f5f9", // light gray
      accent: "#fbbf24" // gold
    },
    backgroundClass: "bg-gradient-to-br from-rose-50 via-pink-50 to-white"
  },

  birthday: {
    id: 'birthday',
    title: "Create Your Birthday Alter Ego",
    subtitle: "Choose your birthday vibe",
    description: "Transform into the perfect birthday character",
    genderSelection: true,
    styles: {
      m1: {
        id: 'm1',
        name: "Party Animal",
        description: "Ready to celebrate all night",
        prompt: "Transform into the ultimate party animal: fun party outfit, party hat or crown, celebration background with balloons and confetti, energetic pose, birthday cake or drinks, festive lighting, photorealistic portrait style",
        gender: 'male',
        tags: ['party', 'fun', 'energetic'],
        difficulty: 'medium'
      },
      f1: {
        id: 'f1',
        name: "Birthday Queen",
        description: "Ruling the birthday kingdom",
        prompt: "Transform into a birthday queen: stunning party dress or outfit, tiara or birthday crown, elegant party setting, birthday cake and presents, confident royal pose, festive but elegant atmosphere, photorealistic portrait style",
        gender: 'female',
        tags: ['elegant', 'royal', 'celebration'],
        difficulty: 'easy'
      }
    },
    colors: {
      primary: "#ec4899", // pink
      secondary: "#8b5cf6", // purple
      accent: "#fbbf24" // gold
    },
    backgroundClass: "bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900"
  }
};

// Utility functions for working with enhanced themes
export const getCurrentEnhancedTheme = (themeId: string = 'miami'): ThemeConfig => {
  return ENHANCED_THEMES[themeId] || ENHANCED_THEMES.miami;
};

export const getStylesForGender = (themeId: string, gender: Gender): Record<string, StyleConfig> => {
  const theme = getCurrentEnhancedTheme(themeId);
  
  if (gender === 'non-binary') {
    return theme.styles; // Show all styles
  }

  const prefix = gender === 'female' ? 'f' : 'm';
  
  return Object.entries(theme.styles)
    .filter(([key, _]) => key.startsWith(prefix))
    .slice(0, 5) // Limit to 5 styles as per reference
    .reduce((acc, [key, style]) => ({ ...acc, [key]: style }), {});
};

export const getAllAvailableThemes = (): ThemeConfig[] => {
  return Object.values(ENHANCED_THEMES);
};

export const getThemeById = (themeId: string): ThemeConfig | null => {
  return ENHANCED_THEMES[themeId] || null;
};

// Legacy compatibility with existing themes.ts
export const CURRENT_THEME = 'miami';
export const THEMES = {
  miami: ENHANCED_THEMES.miami
};

// Backward compatibility functions
export const getCurrentTheme = () => ENHANCED_THEMES[CURRENT_THEME];
export const getStyleConfig = (styleId: string) => getCurrentTheme().styles[styleId];
export const getAllStyles = () => Object.keys(getCurrentTheme().styles);
