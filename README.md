# Miami Reunion AI Profile Generator

An AI-powered web application for creating Miami-themed profile pictures for fraternity reunions. Transform your photos into four distinct Miami styles: Kingpin, Vice, Player, and Tourist.

## Features

- 🎨 **4 Miami Styles**: Kingpin (business executive), Vice (80s aesthetic), Player (nightlife), Tourist (vacation vibe)
- 🤖 **AI Generation**: Powered by Google Gemini 2.5 Flash with photorealistic results
- 📱 **Mobile-First**: Responsive design that works great on all devices
- 🎯 **Interactive UI**: Drag-and-drop polaroid cards with smooth animations
- 📸 **Gallery Creation**: Download individual images or create a composite gallery
- 🔄 **Regeneration**: Shake cards (desktop) or tap (mobile) to regenerate styles

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Miami color palette
- **Animations**: Framer Motion
- **AI**: Google Gemini 2.5 Flash API
- **Deployment**: Ready for Vercel

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd miami-reunion-app
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
VITE_```

### 3. Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## API Keys Setup

**You need a Google Gemini API key to run this application.**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

## Project Structure

```
src/
├── components/
│   ├── NameEntry.tsx          # User name input component
│   ├── PolaroidCard.tsx       # Main image display component
│   ├── Footer.tsx             # App footer with branding
│   └── ui/
│       └── draggable-card.tsx # Draggable card wrapper
├── config/
│   ├── styles.ts              # Generic style configuration
│   └── themes.ts              # Miami theme definitions
├── lib/
│   ├── utils.ts               # Utility functions
│   └── albumUtils.ts          # Gallery creation utilities
├── services/
│   └── geminiService.ts       # Gemini API integration
└── App.tsx                    # Main application component
```

## Miami Theme Configuration

The app uses a flexible theme system. Styles are defined in `src/config/themes.ts`:

```typescript
const THEMES = {
  miami: {
    title: "Create Your Miami Profile Picture",
    subtitle: "Choose your Miami vibe",
    styles: {
      style1: {
        name: "Kingpin",
        description: "Sophisticated Miami business executive",
        prompt: "Professional Miami business executive...",
      },
      // ... more styles
    },
    colors: {
      primary: "#06b6d4", // teal
      secondary: "#ec4899", // pink
      accent: "#f97316"   // orange
    }
  }
};
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`

### Other Platforms

The app can be deployed to any static hosting service. Just build with `npm run build` and serve the `dist` folder.

## Usage

1. **Enter Name**: User enters their name for personalization
2. **Upload Photo**: Click the polaroid to upload a photo
3. **Generate Styles**: Click "Generate Miami Styles" to create all 4 variations
4. **Interact**: Drag cards on desktop, tap regenerate buttons on mobile
5. **Download**: Download individual images or create a gallery composite

## Customization

### Adding New Styles

1. Add style definition to `src/config/themes.ts`
2. Update `STYLE_COUNT` in `src/config/styles.ts`
3. Add reference images to `public/reference-images/`

### Changing Colors

Update the color palette in `src/config/themes.ts` and the Tailwind config.

## Troubleshooting

### Common Issues

1. **API Key Issues**: Make sure your Gemini API key is valid and has proper permissions
2. **Image Generation Fails**: Check browser console for error messages
3. **Build Issues**: Ensure all dependencies are installed with `npm install`

### Rate Limits

Gemini API has rate limits. If you hit limits, the app will automatically retry with fallback prompts.

## License

This project is built using Google's Gemini API and follows their usage policies.
