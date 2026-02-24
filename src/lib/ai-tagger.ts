import { ClosetCategory } from "./types";

export interface AITagResult {
  title: string;
  season: "spring" | "summer" | "fall" | "winter";
  occasion: string[];
  description: string;
  colorPalette: string[];
  items: AIDetectedItem[];
}

export interface AIDetectedItem {
  name: string;
  brand?: string;
  category: ClosetCategory;
  color: string;
  colorHex: string;
  position: { x: number; y: number };
}

const SYSTEM_PROMPT = `You are a fashion analysis assistant for a personal lookbook portfolio. Analyze outfit photos and return structured data.

You MUST respond with ONLY valid JSON matching this exact schema — no markdown, no explanation, no code fences:

{
  "title": "Short evocative outfit title (2-4 words, e.g. 'Autumn Layers', 'Sharp Tailoring')",
  "season": "spring" | "summer" | "fall" | "winter",
  "occasion": ["array of: casual, work, dinner, evening, weekend, brunch, date, travel"],
  "description": "1-2 sentence editorial description of the outfit and its styling intent",
  "colorPalette": ["#hex", "#hex", "#hex", "#hex"] (3-5 dominant colors from the outfit as hex codes),
  "items": [
    {
      "name": "Descriptive item name (e.g. 'Camel Wool Overcoat', 'Black Leather Chelsea Boots')",
      "brand": "Brand if visible/identifiable, otherwise omit this field",
      "category": "jackets" | "blazers" | "tops" | "shirts" | "pants" | "skirts" | "dresses" | "shoes" | "hats" | "bags" | "accessories" | "jewelry" | "other",
      "color": "Color name (e.g. 'Camel', 'Navy', 'Charcoal')",
      "colorHex": "#hex color of the item",
      "position": { "x": 50, "y": 30 }
    }
  ]
}

For position: x and y are percentages (0-100) representing where the item is centered in the photo.
- x=0 is left edge, x=100 is right edge
- y=0 is top edge, y=100 is bottom edge
- Place the dot at the center of the visible garment area

List items from top to bottom (hat first, shoes last). Include every visible garment, accessory, and shoe.`;

export async function analyzeOutfitPhoto(
  imageBase64: string,
  apiKey: string
): Promise<AITagResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageBase64.startsWith("data:image/png")
                  ? "image/png"
                  : "image/jpeg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
              },
            },
            {
              type: "text",
              text: "Analyze this outfit photo. Return ONLY the JSON object, no other text.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON — handle potential markdown code fences
  const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as AITagResult;
  } catch {
    throw new Error(`Failed to parse AI response: ${cleaned.slice(0, 200)}`);
  }
}

export function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image to fit within maxDimension while preserving aspect ratio.
 * Returns a base64 JPEG string. This keeps the payload under the API's ~5MB limit
 * even for large phone photos (10MB+).
 */
export function resizeImageForAPI(
  base64: string,
  maxDimension: number = 1568
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if the image exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG at 85% quality — good balance of size and detail
      const resized = canvas.toDataURL("image/jpeg", 0.85);
      resolve(resized);
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = base64;
  });
}
