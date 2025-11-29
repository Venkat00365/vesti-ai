import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { generateTryOnImage } from './services/geminiService';
import { ImageFile, TryOnResult, Outfit } from './types';

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<ImageFile | null>(null);
  
  // State for multiple outfits
  const [outfits, setOutfits] = useState<Outfit[]>([
    { id: '1', garmentImages: [], description: '' }
  ]);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [results, setResults] = useState<TryOnResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // --- Outfit Management ---

  const handleAddOutfit = () => {
    const newId = (parseInt(outfits[outfits.length - 1]?.id || '0') + 1).toString();
    setOutfits([...outfits, { id: newId, garmentImages: [], description: '' }]);
  };

  const handleRemoveOutfit = (id: string) => {
    if (outfits.length > 1) {
      setOutfits(outfits.filter(o => o.id !== id));
      setResults(results.filter(r => r.outfitId !== id));
    }
  };

  const handleAddGarmentToOutfit = (outfitId: string, file: ImageFile) => {
    setOutfits(prev => prev.map(outfit => {
      if (outfit.id === outfitId) {
        return { ...outfit, garmentImages: [...outfit.garmentImages, file] };
      }
      return outfit;
    }));
  };

  const handleRemoveGarmentFromOutfit = (outfitId: string, imageIndex: number) => {
    setOutfits(prev => prev.map(outfit => {
      if (outfit.id === outfitId) {
        return { 
          ...outfit, 
          garmentImages: outfit.garmentImages.filter((_, i) => i !== imageIndex) 
        };
      }
      return outfit;
    }));
  };

  const handleUpdateDescription = (outfitId: string, text: string) => {
    setOutfits(prev => prev.map(outfit => {
      if (outfit.id === outfitId) {
        return { ...outfit, description: text };
      }
      return outfit;
    }));
  };

  // --- Generation Logic ---

  const handleGenerateAll = async () => {
    if (!userImage) {
      setGlobalError("Please upload a photo of yourself.");
      return;
    }
    
    // Validate at least one outfit has content
    const hasContent = outfits.some(o => o.garmentImages.length > 0 || o.description.trim());
    if (!hasContent) {
      setGlobalError("Please provide garment images or descriptions for at least one outfit.");
      return;
    }

    setIsGenerating(true);
    setGlobalError(null);
    setResults([]); // Clear previous results or you could keep them and append/update

    try {
      // Create promises for all outfits
      const promises = outfits.map(outfit => {
        if (outfit.garmentImages.length === 0 && !outfit.description.trim()) {
           // Skip empty outfits silently, or handle error
           return Promise.resolve(null);
        }
        return generateTryOnImage({
          outfitId: outfit.id,
          userImage,
          garmentImages: outfit.garmentImages,
          description: outfit.description,
        });
      });

      const responses = await Promise.all(promises);
      
      // Filter out nulls and add to results
      const validResponses = responses.filter((r): r is TryOnResult => r !== null);
      setResults(validResponses);

    } catch (err: any) {
      setGlobalError(err.message || "An unexpected error occurred while generating images.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/></svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              StyleMorph AI
            </h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Text */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Virtual Wardrobe Studio
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Create multiple outfits and see yourself wearing each one. Upload your photo once, define your looks, and generate them all at once.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* 1. User Photo */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs">1</span>
                Your Photo
              </h3>
              <ImageUploader 
                label="Full Body Photo" 
                imageFile={userImage}
                onImageSelected={setUserImage}
                onClear={() => setUserImage(null)}
                placeholderText="Upload a clear photo of yourself"
                required
              />
            </div>

            {/* 2. Outfits List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs">2</span>
                  Outfits Collection
                </h3>
                <button 
                  onClick={handleAddOutfit}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Outfit
                </button>
              </div>

              {outfits.map((outfit, index) => (
                <div key={outfit.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-lg relative group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-slate-300 font-medium text-sm">Outfit #{index + 1}</h4>
                    {outfits.length > 1 && (
                      <button 
                        onClick={() => handleRemoveOutfit(outfit.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove Outfit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>

                  {/* Garment Images for this outfit */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {outfit.garmentImages.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 group/img">
                          <img src={img.previewUrl} alt="Garment" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => handleRemoveGarmentFromOutfit(outfit.id, imgIdx)}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* Add Button */}
                      <div className="w-16 h-16">
                        <ImageUploader 
                           label=""
                           imageFile={null}
                           onImageSelected={(file) => handleAddGarmentToOutfit(outfit.id, file)}
                           onClear={() => {}}
                           placeholderText="+"
                           compact={true}
                        />
                      </div>
                    </div>

                    <textarea
                      value={outfit.description}
                      onChange={(e) => handleUpdateDescription(outfit.id, e.target.value)}
                      placeholder="Specific instructions for this outfit..."
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-slate-300 text-xs focus:outline-none focus:border-indigo-500/50 resize-none h-16"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className={`
                sticky bottom-4 z-10 w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20
                flex items-center justify-center gap-3 transition-all duration-300
                ${isGenerating 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] hover:shadow-indigo-500/40'}
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing {outfits.length} Outfits...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/></svg>
                  Generate All Looks
                </>
              )}
            </button>

            {globalError && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <p className="text-red-200 text-sm">{globalError}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Results Grid */}
          <div className="lg:col-span-7">
            <h3 className="text-xl font-bold text-white mb-6">Generated Looks</h3>
            
            {results.length === 0 && !isGenerating ? (
               <div className="bg-slate-900/30 rounded-3xl border border-slate-800/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <h4 className="text-xl font-medium text-slate-300 mb-2">Ready to Transform</h4>
                  <p className="text-slate-500 max-w-sm">
                    Add outfits on the left and click "Generate" to see your virtual fashion show here.
                  </p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {isGenerating && results.length === 0 && (
                   // Skeleton Loading State
                   [...Array(outfits.length)].map((_, i) => (
                      <div key={i} className="bg-slate-900 rounded-2xl h-[500px] border border-slate-800 animate-pulse flex items-center justify-center">
                         <div className="text-slate-600 flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 mb-4 text-indigo-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating Look #{i+1}...</span>
                         </div>
                      </div>
                   ))
                )}
                
                {results.map((result, idx) => {
                  const outfit = outfits.find(o => o.id === result.outfitId);
                  return (
                    <div key={idx} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <span className="bg-indigo-900/50 text-indigo-300 text-xs font-bold px-2 py-1 rounded">
                             Outfit #{outfits.findIndex(o => o.id === result.outfitId) + 1}
                           </span>
                           {outfit?.description && (
                             <span className="text-slate-400 text-xs truncate max-w-[200px]">
                               {outfit.description}
                             </span>
                           )}
                        </div>
                        {result.imageUrl && (
                          <a 
                            href={result.imageUrl} 
                            download={`stylemorph-outfit-${result.outfitId}.png`}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            Download
                          </a>
                        )}
                      </div>

                      <div className="relative min-h-[400px] bg-black/20 flex items-center justify-center p-4">
                        {result.error ? (
                          <div className="text-red-400 text-center p-6">
                            <p className="font-bold mb-2">Generation Failed</p>
                            <p className="text-sm">{result.error}</p>
                          </div>
                        ) : result.imageUrl ? (
                          <img 
                            src={result.imageUrl} 
                            alt={`Result for Outfit ${result.outfitId}`} 
                            className="max-h-[600px] w-auto object-contain rounded-lg shadow-2xl"
                          />
                        ) : (
                           // Should not happen if filtered correctly
                           <p className="text-slate-500">No image generated.</p>
                        )}
                      </div>
                      
                      {/* Outfit Reference Strip */}
                      {outfit && (
                        <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex gap-2 overflow-x-auto">
                          <span className="text-xs text-slate-500 self-center mr-2 uppercase tracking-wide">Used Items:</span>
                          {outfit.garmentImages.map((img, i) => (
                            <img key={i} src={img.previewUrl} className="w-10 h-10 rounded border border-slate-700 object-cover opacity-70 hover:opacity-100 transition-opacity" title={`Item ${i+1}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;