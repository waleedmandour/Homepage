import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an edited version of the provided image based on a text prompt.
 * Uses the Gemini 2.5 Flash Image model.
 */
export const generateEditedImage = async (
  base64Image: string,
  prompt: string
): Promise<string | null> => {
  try {
    // Clean base64 string if it contains metadata
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano banana model for general image tasks
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: `Act as a visual effects editor. Re-generate this image with the following changes applied: ${prompt}. Maintain the main subject's composition but apply the style or modification requested.`
          }
        ]
      }
    });

    // Check for image in the response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.warn("No image data found in response");
    return null;
  } catch (error) {
    console.error("Gemini AI Image Generation Error:", error);
    throw error;
  }
};
