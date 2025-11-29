import React, { useRef } from 'react';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  label: string;
  imageFile: ImageFile | null;
  onImageSelected: (file: ImageFile) => void;
  onClear: () => void;
  placeholderText?: string;
  required?: boolean;
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  imageFile,
  onImageSelected,
  onClear,
  placeholderText = "Click to upload",
  required = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract raw base64 (remove data:image/xxx;base64,)
        const base64Data = result.split(',')[1];
        
        onImageSelected({
          file,
          previewUrl: result,
          base64Data,
          mimeType: file.type,
        });

        // Clear the input so the same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <div 
        onClick={!imageFile ? triggerUpload : undefined}
        className={`
          relative border-2 border-dashed rounded-xl w-full flex flex-col items-center justify-center
          transition-all duration-300 overflow-hidden cursor-pointer
          ${compact ? 'h-32' : 'h-64'}
          ${imageFile ? 'border-indigo-500 bg-slate-800' : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-800/50'}
        `}
      >
        {imageFile ? (
          <>
            <img 
              src={imageFile.previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            <div className={`rounded-full bg-slate-700/50 flex items-center justify-center mx-auto ${compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-3'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width={compact ? "16" : "24"} height={compact ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
            <p className="text-slate-300 font-medium text-sm">{placeholderText}</p>
            {!compact && <p className="text-slate-500 text-xs mt-1">PNG, JPG up to 10MB</p>}
          </div>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
    </div>
  );
};