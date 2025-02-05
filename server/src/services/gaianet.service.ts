import { BaseService } from "./base.service.js";

interface GaiaNetResponse {
  text: string;
  // Add other expected properties
}

export class GaiaNetService extends BaseService {
  private static instance: GaiaNetService;

  private constructor() {
    super();
  }

  public static getInstance(): GaiaNetService {
    if (!GaiaNetService.instance) {
      GaiaNetService.instance = new GaiaNetService();
    }
    return GaiaNetService.instance;
  }

  public async analyzeThemes(
    text: string
  ): Promise<Array<{ theme: string; confidence: number }>> {
    console.log("[GaiaNet] Starting theme analysis");
    console.log("[GaiaNet] Text length:", text.length);

    // Example prompt for theme analysis
    const prompt = `
      Analyze the following tweets and identify the main recurring themes.
      For each theme, provide a confidence score.
      
      Tweets:
      ${text}
      
      Identify up to 5 main themes.
    `;

    console.log("[GaiaNet] Generated prompt:", prompt);
    console.log("[GaiaNet] Server URL:", process.env.GAIANET_SERVER_URL);
    console.log("[GaiaNet] Model:", process.env.GAIANET_MODEL);

    try {
      console.log("[GaiaNet] Making API request...");
      const response = await fetch(process.env.GAIANET_SERVER_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GAIANET_MODEL,
          prompt: prompt,
          max_tokens: 500,
        }),
      });

      console.log("[GaiaNet] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GaiaNet] Error response:", errorText);
        throw new Error(`GaiaNet API error: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as GaiaNetResponse;
      console.log("[GaiaNet] Raw response:", result);

      // Process the response to extract themes
      console.log("[GaiaNet] Parsing themes from response");
      const themes = this.parseThemes(result.text);
      console.log("[GaiaNet] Parsed themes:", themes);

      return themes;
    } catch (error) {
      console.error("[GaiaNet] Analysis error:", error);
      throw error;
    }
  }

  private parseThemes(
    text: string
  ): Array<{ theme: string; confidence: number }> {
    console.log("[GaiaNet] Starting theme parsing");
    console.log("[GaiaNet] Raw text to parse:", text);

    // Basic implementation
    const themes = text
      .split("\n")
      .filter((line) => {
        const isValid = line.trim().length > 0;
        console.log("[GaiaNet] Line:", line, "Valid:", isValid);
        return isValid;
      })
      .map((line) => {
        console.log("[GaiaNet] Processing line:", line);
        return {
          theme: line,
          confidence: 90, // Default confidence
        };
      });

    console.log("[GaiaNet] Final parsed themes:", themes);
    return themes;
  }

  public async start(): Promise<void> {
    if (!process.env.GAIANET_SERVER_URL) {
      throw new Error("GAIANET_SERVER_URL is not defined");
    }
    if (!process.env.GAIANET_MODEL) {
      throw new Error("GAIANET_MODEL is not defined");
    }
    console.log("GaiaNet service started");
  }

  public async stop(): Promise<void> {
    console.log("GaiaNet service stopped");
  }
}
