import React, { useState, useRef } from 'react';
import { generateMiamiImage } from '../services/geminiService';
import { generateSeedreamImage, generateSeedreamTextToImage } from '../services/seedreamService';
import { THEMES } from '../config/themes';

interface ComparisonResult {
  gemini?: {
    url: string;
    time: number;
    error?: string;
  };
  seedream?: {
    url: string;
    time: number;
    error?: string;
  };
}

interface PresetFace {
  name: string;
  url: string;
  description: string;
}

const PRESET_FACES: PresetFace[] = [
  { name: "Dirty Harry", url: "/preset-faces/dirty-harry.jpg", description: "Classic tough guy" },
  { name: "Mark Head", url: "/preset-faces/mark head.jpg", description: "Portrait photo" },
  { name: "Professional", url: "/preset-faces/eb34c6c66c26656938bbe3a750d76f7db83e78a8-2287x2560.jpg", description: "Professional headshot" },
];

export default function ModelComparison() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ComparisonResult>({});
  const [useTextToImage, setUseTextToImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all available styles from both themes
  const getAllStyles = () => {
    const allStyles: Array<{key: string, name: string, prompt: string, theme: string}> = [];
    
    Object.entries(THEMES).forEach(([themeKey, theme]) => {
      Object.entries(theme.styles).forEach(([styleKey, style]) => {
        allStyles.push({
          key: `${themeKey}-${styleKey}`,
          name: style.name,
          prompt: style.prompt,
          theme: themeKey
        });
      });
    });
    
    return allStyles;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setCustomPrompt(''); // Reset custom prompt when new image is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = async (presetUrl: string) => {
    try {
      // Convert preset URL to data URL
      const response = await fetch(presetUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setCustomPrompt(''); // Reset custom prompt when new image is selected
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to load preset face:', error);
      alert('Failed to load preset face. Please try uploading an image instead.');
    }
  };

  const handleStyleSelect = (styleKey: string) => {
    setSelectedStyle(styleKey);
    const style = getAllStyles().find(s => s.key === styleKey);
    if (style) {
      setCustomPrompt(style.prompt);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || (!selectedStyle && !customPrompt)) {
      alert('Please select an image and either choose a style or enter a custom prompt');
      return;
    }

    setIsGenerating(true);
    setResults({});

    const prompt = customPrompt || getAllStyles().find(s => s.key === selectedStyle)?.prompt || '';
    const requestId = `comparison-${Date.now()}`;

    // Generate with both models in parallel
    const promises = [
      // Gemini generation
      (async () => {
        const startTime = Date.now();
        try {
          const url = await generateMiamiImage(selectedImage, prompt, `${requestId}-gemini`);
          return {
            model: 'gemini' as const,
            url,
            time: Date.now() - startTime,
          };
        } catch (error) {
          return {
            model: 'gemini' as const,
            error: error instanceof Error ? error.message : String(error),
            time: Date.now() - startTime,
          };
        }
      })(),
      
      // Seedream generation
      (async () => {
        const startTime = Date.now();
        try {
          const url = useTextToImage 
            ? await generateSeedreamTextToImage(prompt, `${requestId}-seedream`)
            : await generateSeedreamImage(selectedImage, prompt, `${requestId}-seedream`);
          return {
            model: 'seedream' as const,
            url,
            time: Date.now() - startTime,
          };
        } catch (error) {
          return {
            model: 'seedream' as const,
            error: error instanceof Error ? error.message : String(error),
            time: Date.now() - startTime,
          };
        }
      })(),
    ];

    const results = await Promise.all(promises);
    
    const comparisonResult: ComparisonResult = {};
    results.forEach(result => {
      if (result.model === 'gemini') {
        comparisonResult.gemini = result;
      } else if (result.model === 'seedream') {
        comparisonResult.seedream = result;
      }
    });

    setResults(comparisonResult);
    setIsGenerating(false);
  };

  const handleDownloadImage = async (imageUrl: string, modelName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelName}-generated-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image');
    }
  };

  const allStyles = getAllStyles();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Model Comparison: Gemini 2.5 Flash vs Seedream 4.0 Edit
        </h1>

        {/* Image Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Reference Image</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <h3 className="font-medium mb-2">Upload Image</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Preset Faces */}
            <div>
              <h3 className="font-medium mb-2">Or Choose Preset Face</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_FACES.map((face) => (
                  <button
                    key={face.name}
                    onClick={() => handlePresetSelect(face.url)}
                    className="p-2 border rounded hover:bg-gray-50 text-sm"
                  >
                    {face.name}
                    <div className="text-xs text-gray-500">{face.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Selected Image */}
          {selectedImage && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Selected Image:</h3>
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Style Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Select Character Style</h2>
          
          <select
            value={selectedStyle}
            onChange={(e) => handleStyleSelect(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="">Choose a character style...</option>
            {allStyles.map((style) => (
              <option key={style.key} value={style.key}>
                {style.theme.toUpperCase()} - {style.name}
              </option>
            ))}
          </select>

          {/* Custom Prompt */}
          <div>
            <h3 className="font-medium mb-2">Custom/Edit Prompt:</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-3 border rounded h-32 text-sm"
              placeholder="Enter or edit the prompt for generation..."
            />
          </div>

          {/* Seedream Mode Toggle */}
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useTextToImage}
                onChange={(e) => setUseTextToImage(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                Use Seedream Text-to-Image (faster, no face preservation)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {useTextToImage 
                ? "Fast mode: Generates from text only, no reference image needed" 
                : "Edit mode: Uses your reference image for face preservation (slower)"}
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedImage || (!selectedStyle && !customPrompt)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Comparison'}
          </button>
        </div>

        {/* Results Display */}
        {(results.gemini || results.seedream || isGenerating) && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Gemini Results */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-center text-green-600">Gemini 2.5 Flash</h3>
                {isGenerating && !results.gemini && (
                  <div className="bg-gray-200 animate-pulse h-64 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-500">Generating...</span>
                  </div>
                )}
                {results.gemini?.url && (
                  <>
                    <img 
                      src={results.gemini.url} 
                      alt="Gemini result" 
                      className="w-full h-64 object-cover rounded mb-2"
                    />
                    <button
                      onClick={() => handleDownloadImage(results.gemini!.url, 'gemini')}
                      className="w-full bg-green-600 text-white py-1 px-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Download
                    </button>
                  </>
                )}
                {results.gemini?.error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm">
                    Error: {results.gemini.error}
                  </div>
                )}
                {results.gemini && (
                  <div className="text-sm text-gray-600 mt-2">
                    Generation time: {(results.gemini.time / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Seedream Results */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-center text-purple-600">
                  Seedream 4.0 {useTextToImage ? 'Text-to-Image' : 'Edit'}
                </h3>
                {isGenerating && !results.seedream && (
                  <div className="bg-gray-200 animate-pulse h-64 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-500">Generating...</span>
                  </div>
                )}
                {results.seedream?.url && (
                  <>
                    <img 
                      src={results.seedream.url} 
                      alt="Seedream result" 
                      className="w-full h-64 object-cover rounded mb-2"
                    />
                    <button
                      onClick={() => handleDownloadImage(results.seedream!.url, 'seedream')}
                      className="w-full bg-purple-600 text-white py-1 px-2 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      Download
                    </button>
                  </>
                )}
                {results.seedream?.error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm">
                    Error: {results.seedream.error}
                  </div>
                )}
                {results.seedream && (
                  <div className="text-sm text-gray-600 mt-2">
                    Generation time: {(results.seedream.time / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Summary */}
            {results.gemini && results.seedream && (
              <div className="mt-6 bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Comparison Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Gemini 2.5 Flash:</strong>
                    <br />
                    {results.gemini.url ? '✅ Success' : '❌ Failed'}
                    <br />
                    Time: {(results.gemini.time / 1000).toFixed(1)}s
                  </div>
                  <div>
                    <strong>Seedream 4.0 Edit:</strong>
                    <br />
                    {results.seedream.url ? '✅ Success' : '❌ Failed'}
                    <br />
                    Time: {(results.seedream.time / 1000).toFixed(1)}s
                  </div>
                </div>
                {results.gemini.time && results.seedream.time && (
                  <div className="mt-2 text-sm">
                    <strong>Speed Winner:</strong> {results.gemini.time < results.seedream.time ? 'Gemini 2.5 Flash' : 'Seedream 4.0 Edit'} 
                    ({Math.abs((results.gemini.time - results.seedream.time) / 1000).toFixed(1)}s faster)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
