/**
 * AI Service for Virtual Tours
 * Provides AI-powered features for automated tour generation and content optimization
 */

import { EventEmitter } from "node:events";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIGeneratedContent,
  HotspotSuggestion,
  SceneConnectionSuggestion,
  TourMetadata,
  TourScene,
  VoiceScript,
} from "@kaa/models/types";
import OpenAI from "openai";
import sharp from "sharp";

type AIConfig = {
  openai: {
    apiKey: string;
    model: string;
  };
  google: {
    apiKey: string;
    model: string;
  };
  vision: {
    provider: "openai" | "google" | "local";
    confidence: number;
  };
  tts: {
    provider: "openai" | "google" | "elevenlabs";
    voices: Record<string, string>;
  };
};

type ObjectDetectionResult = {
  objects: DetectedObject[];
  rooms: DetectedRoom[];
  features: DetectedFeature[];
  quality: QualityMetrics;
};

type DetectedObject = {
  name: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  category: string;
  attributes: Record<string, any>;
};

type DetectedRoom = {
  type: string;
  confidence: number;
  area: number;
  features: string[];
  lighting: "natural" | "artificial" | "mixed";
  condition: "excellent" | "good" | "fair" | "poor";
};

type DetectedFeature = {
  type: string;
  description: string;
  location: { x: number; y: number };
  importance: number;
};

type QualityMetrics = {
  resolution: { width: number; height: number };
  sharpness: number;
  exposure: number;
  colorBalance: number;
  noise: number;
  overall: number;
};

export class AIService extends EventEmitter {
  private readonly openai: OpenAI;
  readonly gemini: GoogleGenerativeAI;
  private readonly config: AIConfig;

  constructor() {
    super();

    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: "gpt-4-vision-preview",
      },
      google: {
        apiKey: process.env.GOOGLE_AI_API_KEY || "",
        model: "gemini-pro-vision",
      },
      vision: {
        provider: "openai",
        confidence: 0.7,
      },
      tts: {
        provider: "elevenlabs",
        voices: {
          "en-male": "TxGEqnHWrfWFTfGW9XjX",
          "en-female": "EXAVITQu4vr4xnSDxMaL",
          "sw-male": "custom-swahili-male",
          "sw-female": "custom-swahili-female",
        },
      },
    };

    this.openai = new OpenAI({
      apiKey: this.config.openai.apiKey,
    });

    this.gemini = new GoogleGenerativeAI(this.config.google.apiKey);
  }

  /**
   * Analyze 360° image and generate comprehensive tour content
   */
  async analyzeScene(
    imageBuffer: Buffer,
    metadata?: Partial<TourMetadata>
  ): Promise<AIGeneratedContent> {
    try {
      const [objectDetection, contentGeneration, qualityAnalysis] =
        await Promise.all([
          this.detectObjects(imageBuffer),
          this.generateSceneContent(imageBuffer, metadata),
          this.analyzeImageQuality(imageBuffer),
        ]);

      const hotspotSuggestions =
        await this.generateHotspotSuggestions(objectDetection);
      const voiceScript = await this.generateVoiceScript(
        contentGeneration,
        metadata?.county
      );

      return {
        title: contentGeneration.title,
        description: contentGeneration.description,
        hotspotSuggestions,
        sceneConnections: [],
        metadata: {
          ...metadata,
          features: objectDetection.features.map((f) => f.type),
        },
        voiceScript: [voiceScript],
      };
    } catch (error) {
      console.error("AI scene analysis error:", error);
      throw new Error("Failed to analyze scene with AI");
    }
  }

  /**
   * Object detection and scene understanding
   */
  private async detectObjects(
    imageBuffer: Buffer
  ): Promise<ObjectDetectionResult> {
    const base64Image = imageBuffer.toString("base64");

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this 360° property image and provide a detailed JSON response with:
								1. Objects detected (furniture, appliances, fixtures)
								2. Room type and characteristics
								3. Notable features and amenities
								4. Quality assessment
								
								Focus on features relevant to Kenyan property market and rental considerations.
								Format response as structured JSON.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const analysis = JSON.parse(response.choices[0]?.message.content || "{}");

      return {
        objects: analysis.objects || [],
        rooms: analysis.rooms || [],
        features: analysis.features || [],
        quality: analysis.quality || { overall: 0.8 },
      };
    } catch (error) {
      console.error("Object detection error:", error);
      // Fallback to basic analysis
      return {
        objects: [],
        rooms: [
          {
            type: "unknown",
            confidence: 0.5,
            area: 0,
            features: [],
            lighting: "mixed",
            condition: "good",
          },
        ],
        features: [],
        quality: {
          overall: 0.7,
          resolution: { width: 1920, height: 1080 },
          sharpness: 0.8,
          exposure: 0.7,
          colorBalance: 0.7,
          noise: 0.2,
        },
      };
    }
  }

  /**
   * Generate scene content using AI
   */
  private async generateSceneContent(
    imageBuffer: Buffer,
    metadata?: Partial<TourMetadata>
  ): Promise<{ title: string; description: string }> {
    const base64Image = imageBuffer.toString("base64");
    const locationContext = metadata?.county
      ? `in ${metadata.county}, Kenya`
      : "in Kenya";

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert real estate content creator specializing in the Kenyan property market. Create compelling, accurate descriptions for property virtual tours.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate an engaging title and description for this property scene ${locationContext}. 
								Consider:
								- Kenyan property market preferences
								- Local amenities and features
								- Professional real estate language
								- Appeal to potential tenants/buyers
								
								Respond with JSON: {"title": "...", "description": "..."}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = JSON.parse(response.choices[0]?.message.content || "{}");
      return {
        title: content.title || "Property Scene",
        description: content.description || "Beautiful property scene",
      };
    } catch (error) {
      console.error("Content generation error:", error);
      return {
        title: "Property Scene",
        description: "Spacious and well-lit room with modern amenities",
      };
    }
  }

  /**
   * Generate intelligent hotspot suggestions
   */
  private generateHotspotSuggestions(
    detection: ObjectDetectionResult
  ): HotspotSuggestion[] {
    const suggestions: HotspotSuggestion[] = [];

    // Generate hotspots based on detected objects
    for (const obj of detection.objects) {
      if (obj.confidence > this.config.vision.confidence) {
        const hotspot: HotspotSuggestion = {
          type: this.mapObjectToHotspotType(obj.category),
          position: {
            x: obj.boundingBox.x + obj.boundingBox.width / 2,
            y: obj.boundingBox.y + obj.boundingBox.height / 2,
            yaw: 0,
            pitch: 0,
          },
          confidence: obj.confidence,
          content: {
            title: obj.name,
            description: this.generateHotspotDescription(obj),
          },
          reasoning: `Detected ${obj.name} with ${Math.round(obj.confidence * 100)}% confidence`,
        };
        suggestions.push(hotspot);
      }
    }

    // Generate feature hotspots
    for (const feature of detection.features) {
      if (feature.importance > 0.5) {
        suggestions.push({
          type: "info" as HotspotSuggestion["type"],
          position: {
            x: feature.location.x,
            y: feature.location.y,
            yaw: 0,
            pitch: 0,
          },
          confidence: feature.importance,
          content: {
            title: feature.type,
            description: feature.description,
          },
          reasoning: `Important feature detected: ${feature.type}`,
        });
      }
    }

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }

  /**
   * Generate voice script for scenes
   */
  private async generateVoiceScript(
    content: { title: string; description: string },
    county?: string
  ): Promise<VoiceScript> {
    try {
      const locationContext = county ? ` located in ${county}` : "";
      const prompt = `Create a natural, engaging voice narration script for a virtual property tour scene titled "${content.title}". 
			Description: ${content.description}${locationContext}
			
			Make it:
			- Conversational and welcoming
			- Under 30 seconds when spoken
			- Highlight key selling points
			- Sound natural for Kenyan audience`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a professional property tour guide creating narration scripts.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const script =
        response.choices[0]?.message.content || content.description;

      return {
        sceneId: "",
        text: script,
        language: "en",
        voice: "female",
        timing: {
          start: 0,
          duration: Math.max(script.length * 50, 3000), // Estimate duration
        },
      };
    } catch (error) {
      console.error("Voice script generation error:", error);
      return {
        sceneId: "",
        text: content.description,
        language: "en",
        voice: "female",
        timing: { start: 0, duration: 5000 },
      };
    }
  }

  /**
   * Analyze image quality and suggest improvements
   */
  private async analyzeImageQuality(
    imageBuffer: Buffer
  ): Promise<QualityMetrics> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      // Basic quality analysis using sharp
      const stats = await sharp(imageBuffer).stats();

      return {
        resolution: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
        sharpness: this.calculateSharpness(stats),
        exposure: this.calculateExposure(stats),
        colorBalance: this.calculateColorBalance(stats),
        noise: this.calculateNoise(stats),
        overall: 0.8, // Simplified overall score
      };
    } catch (error) {
      console.error("Quality analysis error:", error);
      return {
        resolution: { width: 1920, height: 1080 },
        sharpness: 0.7,
        exposure: 0.7,
        colorBalance: 0.7,
        noise: 0.3,
        overall: 0.7,
      };
    }
  }

  /**
   * Enhanced image quality using AI upscaling
   */
  async enhanceImageQuality(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Use Real-ESRGAN or similar for upscaling
      // For now, use sharp for basic enhancement
      const enhanced = await sharp(imageBuffer)
        .sharpen()
        .normalize()
        .modulate({ brightness: 1.1, saturation: 1.05 })
        .png({ quality: 90 })
        .toBuffer();

      return enhanced;
    } catch (error) {
      console.error("Image enhancement error:", error);
      return imageBuffer;
    }
  }

  /**
   * Generate scene connections using AI
   */
  async generateSceneConnections(
    scenes: TourScene[]
  ): Promise<SceneConnectionSuggestion[]> {
    if (scenes.length < 2) return [];

    try {
      const sceneDescriptions = scenes.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: s.type,
      }));

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert in creating logical navigation flows for virtual property tours.",
          },
          {
            role: "user",
            content: `Given these scenes from a property tour, suggest logical connections between them for smooth navigation:

						${JSON.stringify(sceneDescriptions, null, 2)}

						Respond with JSON array of connections: [{"fromSceneId": "...", "toSceneId": "...", "confidence": 0.9, "transition": "fade"}]`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const connections = JSON.parse(
        response.choices[0]?.message.content || "[]"
      );

      return connections.map((conn: any) => ({
        ...conn,
        position: { x: 0, y: 0, z: 1 }, // Default position
      }));
    } catch (error) {
      console.error("Scene connection generation error:", error);
      return [];
    }
  }

  /**
   * Generate text-to-speech audio
   */
  async generateVoiceNarration(script: VoiceScript): Promise<Buffer> {
    try {
      if (this.config.tts.provider === "openai") {
        const mp3 = await this.openai.audio.speech.create({
          model: "tts-1",
          voice: script.voice === "male" ? "onyx" : "nova",
          input: script.text,
        });

        return Buffer.from(await mp3.arrayBuffer());
      }

      // Fallback to basic TTS or external service
      throw new Error("TTS service not configured");
    } catch (error) {
      console.error("Voice generation error:", error);
      throw error;
    }
  }

  /**
   * Detect property damage and issues
   */
  async detectDamage(
    imageBuffer: Buffer
  ): Promise<{ issues: any[]; severity: string }> {
    const base64Image = imageBuffer.toString("base64");

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this property image for any damage, maintenance issues, or problems. 
								Look for: cracks, stains, damage, wear, poor maintenance, safety issues.
								Respond with JSON: {"issues": [{"type": "...", "severity": "...", "location": "...", "description": "..."}], "overall_severity": "none|low|medium|high"}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const analysis = JSON.parse(response.choices[0]?.message.content || "{}");
      return {
        issues: analysis.issues || [],
        severity: analysis.overall_severity || "none",
      };
    } catch (error) {
      console.error("Damage detection error:", error);
      return { issues: [], severity: "none" };
    }
  }

  // Utility methods
  private mapObjectToHotspotType(category: string): any {
    const mapping: Record<string, any> = {
      appliance: "info",
      furniture: "info",
      fixture: "info",
      door: "navigation",
      window: "info",
      outlet: "info",
      switch: "info",
    };
    return mapping[category] || "info";
  }

  private generateHotspotDescription(obj: DetectedObject): string {
    const templates: Record<string, string> = {
      kitchen: "Modern kitchen with quality appliances and ample storage space",
      bedroom: "Comfortable bedroom with natural lighting and built-in storage",
      bathroom: "Well-appointed bathroom with modern fixtures",
      living_room:
        "Spacious living area perfect for relaxation and entertainment",
    };

    return (
      templates[obj.category] || `${obj.name} - well-maintained and functional`
    );
  }

  private calculateSharpness(stats: any): number {
    // Simplified sharpness calculation
    return Math.min(stats.sharpness || 0.8, 1.0);
  }

  private calculateExposure(stats: any): number {
    // Simplified exposure calculation based on brightness
    const brightness = (stats.mean?.[0] || 127) / 255;
    return 1 - Math.abs(brightness - 0.5) * 2;
  }

  private calculateColorBalance(stats: any): number {
    // Simplified color balance calculation
    return stats.balance || 0.8;
  }

  private calculateNoise(stats: any): number {
    // Simplified noise calculation
    return Math.min(stats.noise || 0.2, 1.0);
  }

  /**
   * Initialize AI service
   */
  initialize(): void {
    // AI service is ready to use immediately
    // Models are loaded on-demand
    console.log("AI Service ready for content generation and analysis");
  }

  /**
   * Get service health
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    apiKeys: boolean;
    features: string[];
  } {
    const hasOpenAI = !!this.config.openai.apiKey;
    const hasGoogle = !!this.config.google.apiKey;

    return {
      status: hasOpenAI || hasGoogle ? "healthy" : "degraded",
      apiKeys: hasOpenAI || hasGoogle,
      features: [
        "scene-analysis",
        "content-generation",
        "quality-enhancement",
        "voice-narration",
      ],
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): {
    provider: string;
    confidence: number;
    features: string[];
    uptime: number;
  } {
    return {
      provider: this.config.vision.provider,
      confidence: this.config.vision.confidence,
      features: [
        "object-detection",
        "content-generation",
        "image-enhancement",
        "voice-synthesis",
      ],
      uptime: process.uptime(),
    };
  }
}

// export default new AIService();
