import { GoogleGenAI } from "@google/genai";
import { TryOnRequest, TryOnResult } from '../types';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a virtual try-on image using Gemini 2.5 Flash Image model.
 * It uses the "Edit" capability by providing input images and a prompt.
 */
export const generateTryOnImage = async (request: TryOnRequest): Promise<TryOnResult> => {
  try {
    const parts: any[] = [];

    // 1. Add User Image (The base image to edit)
    parts.push({
      inlineData: {
        mimeType: request.userImage.mimeType,
        data: request.userImage.base64Data,
      },
    });
    parts.push({ text: "This is the user's photo." });

    // 2. Add Garment Images if provided
    if (request.garmentImages && request.garmentImages.length > 0) {
      request.garmentImages.forEach((img, index) => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64Data,
          },
        });
        parts.push({ text: `This is clothing item #${index + 1} for the outfit.` });
      });
    }

    // 3. Construct the prompt
    // We need a strong prompt to guide the model to perform a "Virtual Try-On"
    let prompt = `
      Act as a professional fashion stylist and photo editor.
      Task: Generate a photorealistic image of the person from the first image wearing the outfit composed of the clothing items provided.
      
      Instructions:
      - Replace the current clothing of the person with the target clothing items.
      - YOU MUST USE ALL PROVIDED CLOTHING ITEMS. Combine them into a complete cohesive outfit.
      - Keep the person's face, pose, body shape, and the background exactly as they are in the first image.
      - Ensure the lighting and shadows on the new clothing match the original scene.
      - High fidelity and realistic fabric texture are required.
    `;

    if (request.description) {
      prompt += `\nAdditional Instructions: ${request.description}`;
    }

    if (request.garmentImages && request.garmentImages.length > 0) {
      prompt += `\nUse the visual details from the clothing images provided to apply the textures, colors, and cuts to the person.`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        // No system instruction for image models usually, doing it in prompt
      }
    });

    let imageUrl: string | null = null;
    let textResponse: string | null = null;

    // Parse response for both Image and Text
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          // We need to guess the mime type if not provided, but usually it is PNG or JPEG.
          // The API often returns raw bytes. We construct a usable data URI.
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
    }

    if (!imageUrl && !textResponse) {
      throw new Error("No content generated.");
    }

    return { outfitId: request.outfitId, imageUrl, textResponse };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      outfitId: request.outfitId, 
      imageUrl: null, 
      textResponse: null, 
      error: error.message || "Failed to generate image" 
    };
  }
};