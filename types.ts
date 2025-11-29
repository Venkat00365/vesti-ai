export interface ImageFile {
  file: File;
  previewUrl: string;
  base64Data: string; // Raw base64 data without prefix for API
  mimeType: string;
}

export interface Outfit {
  id: string;
  garmentImages: ImageFile[];
  description: string;
}

export interface TryOnRequest {
  outfitId: string;
  userImage: ImageFile;
  garmentImages: ImageFile[];
  description: string;
}

export interface TryOnResult {
  outfitId: string;
  imageUrl: string | null;
  textResponse: string | null;
  error?: string;
}