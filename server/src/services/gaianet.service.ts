import { BaseService } from "./base.service.js";
import axios from "axios";
import { ThemeAnalysis } from "./tweet-analyzer.service.js";

interface GaiaNetResponse {
  data: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
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
  ): Promise<
    Array<{ theme: string; description: string; confidence: number }>
  > {
    // Your original fine-tuned prompt
    const prompt = `
      You are a qualitativer researcher who loves science-fiction and historical novels. This worldview influences your work. 
      Analyze the following tweets and identify the main recurring themes. 
      For each theme provide a heading. The heading can only have one word.
      For each theme, provide a confidence score.
      
      Format your response as a JSON array with objects containing 'theme' and 'description' properties.
      Example format:
      [
        {
          "theme": "AI Ethics",
          "description": "Discussions about responsible AI development",
          "confidence": 0.9
        }
      ]
      
      Tweets:
      ${text}
      
      Identify up to 5 main themes.
    `;

    const response = await this.makeRequest(prompt);
    return this.parseResponse(response);
  }

  private async makeRequest(prompt: string) {
    return axios.post(
      `${process.env.GAIANET_SERVER_URL}/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content:
              "You are a data analyst who returns responses in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: process.env.GAIANET_MODEL,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
      }
    );
  }

  private parseResponse(response: GaiaNetResponse): ThemeAnalysis[] {
    try {
      const themes = JSON.parse(response.data.choices[0].message.content);
      return themes.map(
        (theme: {
          theme: string;
          description: string;
          confidence?: number;
        }): ThemeAnalysis => ({
          theme: theme.theme,
          description: theme.description,
          confidence: theme.confidence ?? 0.5, // Ensure confidence is always set
        })
      );
    } catch (error) {
      console.error("[GaiaNet] Failed to parse response:", error);
      throw new Error("Failed to parse response");
    }
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

  public async generateStory(theme: string): Promise<string> {
    console.log("[GaiaNet] Writing story for theme:", theme);

    // Prompt for story writing
    const prompt = ` Write a short sci-fi story about the following theme: ${theme}.
    
    The story should be not more than 300 words. The story should have the following elements:
    - a protagonist or hero who is experiencing a problem or challenge. This can be a person, artificial being, alien.
    - the hero should experience an external, internal or philosophical challenge. An external challenge is something they have to achieve. An internal challenge is a conflict with themselves. A philosophical challenge is a broader challenge about the world, good vs evil.
    - the story should have science fiction elements. This can be a futuristic setting, alien life, advanced technology, etc.
    - The story should be written in an active voice. `;

    console.log("[GaiaNet] Generated prompt:", prompt);
    console.log("[GaiaNet] Server URL:", process.env.GAIANET_SERVER_URL);
    console.log("[GaiaNet] Model:", process.env.GAIANET_MODEL);

    try {
      console.log("[GaiaNet] Making API request...");
      const response = await axios.post(
        `${process.env.GAIANET_SERVER_URL}/chat/completions`,
        {
          messages: [
            {
              role: "system",
              content:
                "You are a science-fiction writers who loves historical novels and is fascinated by political philosophy and behahvioral science.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: process.env.GAIANET_MODEL,
          temperature: 0.5,
          max_tokens: 500,
        },
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );

      console.log("[GaiaNet] Response status:", response.status);

      if (!response.data) {
        console.error("[GaiaNet] Empty response");
        throw new Error("GaiaNet API returned empty response");
      }

      // Get text from the correct location in response
      // Process the response to extract themes
      console.log("[GaiaNet] getting the stroy");

      const story = response.data.choices[0].message.content;
      console.log("[GaiaNet] Raw response:", story);

      if (!story) {
        throw new Error("No text in GaiaNet response");
      }

      return story;
    } catch (error) {
      console.error("[GaiaNet] Analysis error:", error);
      throw error;
    }
  }
}
