// Theme-specific content for both Miami and Ibiza apps
export const CURRENT_THEME = 'miami'; // Keep Miami as default for existing app

export const THEMES = {
  miami: {
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vice (literally)",
    styles: {
      style1: {
        name: "Drug Lord",
        description: "Scarface energy, baby",
        prompt: "Transform into a Miami drug lord: expensive white linen suit, heavy gold chains, confident powerful stance, luxury mansion with palm trees in background, dramatic golden hour lighting, Scarface aesthetic, cigar smoke atmosphere, photorealistic portrait style",
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
  },
  ibiza: {
    title: "Create Your Ibiza Profile Picture",
    subtitle: "Mock your Ibiza stereotype (party on)",
    styles: {
      f1: {
        name: "Selfie Influencer",
        description: "Posing like your feed depends on it",
        prompt: "Transform into an Ibiza selfie influencer: oversized sunglasses, flowy boho dress with too many accessories, pouting dramatically while taking a mirror selfie, infinity pool and palm trees in luxurious villa background, fake spiritual crystals scattered around, neon festival wristbands, over-edited filter aesthetic, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/f1/ref-1.jpg", "/reference-images/ibiza/f1/ref-2.jpg"]
      },
      f2: {
        name: "Club Siren",
        description: "Dancing like no one's judging (but they are)",
        prompt: "Transform into an Ibiza club siren: skimpy sequined outfit, messy hair from all-night raving, glow sticks and confetti everywhere, crowded nightclub with strobe lights and DJ booth in background, spilling a colorful cocktail while attempting a sexy pose, exhausted but euphoric expression, vibrant neon lighting, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/f2/ref-1.jpg", "/reference-images/ibiza/f2/ref-2.jpg"]
      },
      f3: {
        name: "Boho Hippie",
        description: "Free spirit, paid vacation",
        prompt: "Transform into an Ibiza boho hippie: layered ethnic prints and fringe overload, flower crown slipping off, pretending to meditate on a crowded beach, yoga mat and essential oils nearby, sunburnt skin with mismatched tan lines, eclectic jewelry clashing wildly, serene yet chaotic sunset beach scene, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/f3/ref-1.jpg", "/reference-images/ibiza/f3/ref-2.jpg"]
      },
      f4: {
        name: "Wannabe Shaman",
        description: "Enlightened after one ayahuasca retreat",
        prompt: "Transform into an Ibiza wannabe shaman: feathers and crystals in hair, flowy robes with mystical symbols, holding a smudge stick awkwardly, surrounded by tarot cards and incense in a hippy market stall, confused enlightened gaze, colorful tents and other tourists in background, golden hour mystical lighting, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/f4/ref-1.jpg", "/reference-images/ibiza/f4/ref-2.jpg"]
      },
      f5: {
        name: "Lost Tourist",
        description: "Map? What map?",
        prompt: "Transform into an Ibiza lost tourist: tacky floral shirt and shorts, massive backpack and fanny pack, holding a crumpled map upside down, sunburnt face with white sunglass marks, surrounded by partygoers and street vendors, bewildered expression at a beach bar, chaotic midday crowd scene, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/f5/ref-1.jpg", "/reference-images/ibiza/f5/ref-2.jpg"]
      },
      m1: {
        name: "Party Bro",
        description: "Shirt optional, ego mandatory",
        prompt: "Transform into an Ibiza party bro: shirtless with neon body paint, backward cap and glow necklaces, flexing awkwardly in a foam party, beer in hand spilling everywhere, crowded club with lasers and bass speakers in background, overly confident grin, sweaty chaotic nightlife vibe, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/m1/ref-1.jpg", "/reference-images/ibiza/m1/ref-2.jpg"]
      },
      m2: {
        name: "DJ Wannabe",
        description: "Headphones on, talent off",
        prompt: "Transform into an Ibiza DJ wannabe: oversized headphones around neck, graphic tee with EDM slogans, posing at a fake turntable setup on the beach, sunglasses at night, surrounded by adoring fans that don't exist, dramatic stage lights and smoke machines, smug aspiring artist expression, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/m2/ref-1.jpg", "/reference-images/ibiza/m2/ref-2.jpg"]
      },
      m3: {
        name: "Yacht Playboy",
        description: "Rented luxury, permanent delusion",
        prompt: "Transform into an Ibiza yacht playboy: unbuttoned linen shirt, gold chains dangling, lounging on a tiny rented boat pretending it's a mega-yacht, champagne flute in hand, surrounded by inflatable toys and empty bottles, posing with fake models, azure sea and cliffs in background, arrogant smirk, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/m3/ref-1.jpg", "/reference-images/ibiza/m3/ref-2.jpg"]
      },
      m4: {
        name: "Spiritual Dude",
        description: "Namaste, pass the joint",
        prompt: "Transform into an Ibiza spiritual dude: dreadlocks tied messily, tie-dye shirt and harem pants, attempting a yoga pose on a rocky cliff, beads and amulets everywhere, distant gaze as if enlightened, hippie commune tents and fire pits in background, hazy sunset aura, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/m4/ref-1.jpg", "/reference-images/ibiza/m4/ref-2.jpg"]
      },
      m5: {
        name: "Rave Veteran",
        description: "Too old for this, but trying",
        prompt: "Transform into an Ibiza rave veteran: balding with ponytail, outdated rave gear like baggy pants and whistles, dancing off-beat in a young crowd, glow sticks from the 90s, sweaty and out of breath, massive club speakers and strobe lights in background, determined but tired expression, photorealistic portrait style",
        referenceImages: ["/reference-images/ibiza/m5/ref-1.jpg", "/reference-images/ibiza/m5/ref-2.jpg"]
      }
    },
    colors: {
      primary: "#6366f1", // indigo
      secondary: "#f43f5e", // rose
      accent: "#fbbf24" // amber
    }
  }
};

// Helper functions
export const getCurrentTheme = () => THEMES[CURRENT_THEME];
export const getStyleConfig = (styleId) => getCurrentTheme().styles[styleId];
export const getAllStyles = () => Object.keys(getCurrentTheme().styles);
export const getTheme = (themeName: string) => THEMES[themeName];