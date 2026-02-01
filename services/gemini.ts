
import { GoogleGenAI } from "@google/genai";
import { PostRequest } from "../types";

const DEFAULT_SYSTEM_INSTRUCTION = `
    You are an expert Social Media Marketer in Myanmar.
    Your task is to generate highly engaging Facebook posts in Myanmar language (Unicode).
    
    Guidelines:
    1. Business Name: {{businessName}}
    2. Tone: {{tone}}
    3. Language: Natural Myanmar Unicode.
    4. Structure: 
       - Catchy Hook.
       - Concise body.
       - Clear CTA.
       - Use emojis.
    5. Details:
       {{phone}}
       {{address}}
`;

export async function generateFBPost(request: PostRequest, customInstruction?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview'; 
  
  let sysPrompt = (customInstruction || DEFAULT_SYSTEM_INSTRUCTION)
    .replace('{{businessName}}', request.businessName || 'Your Business')
    .replace('{{tone}}', request.tone)
    .replace('{{phone}}', request.phoneNumber ? `- Phone: ${request.phoneNumber}` : '')
    .replace('{{address}}', request.address ? `- Location: ${request.address}` : '');

  let contents: any = null;

  if (request.type === 'topic') {
    contents = `Create a Facebook post about: "${request.topic}".`;
  } else if (request.type === 'image' && request.image) {
    contents = {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: request.image.split(',')[1] || request.image } },
        { text: "Analyze this image and create an engaging Facebook post." }
      ]
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: sysPrompt,
      temperature: 0.7,
    }
  });
  return response.text || "Generation failed.";
}

export async function generateFBDesign(request: PostRequest): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-2.5-flash-image';
  const prompt = `Modern commercial social media poster for ${request.businessName}. Topic: ${request.topic}. Include phone: ${request.phoneNumber}. Style: Clean, Professional.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Design generation failed.");
}
