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

  public async analyzeThemes(text: string): Promise<ThemeAnalysis[]> {
    const prompt = `
      You are a qualitativer researcher who loves science-fiction and historical novels. This worldview influences your work. 
      Analyze the following tweets and identify the main recurring themes. 
      For each theme provide a heading. The heading can only have one word.
      For each theme, provide a confidence score.
      
      Format your response in markdown. The theme is the heading. It is a single word. 
      The description is a 100 character description of the theme. 
      Confidence level is how confident you are that the user talks abotu this theme. 

      IN the theme do not include words like 
      - "the role of"
      - "the importance of"
      - "the impact of"
      - "the future of"
      - "the challenge of"
      - "the importance of"
      - "the impact of"
      - "the future of"
      - "the challenge of"
      
      Tweets:
      ${text}
      
      Identify up to 5 main themes.`;

    const response = await this.makeRequest(prompt, 0.9);
    return this.parseMarkdownResponse(response);
  }

  private async makeRequest(prompt: string, temperature: number) {
    return axios.post(
      `${process.env.GAIANET_SERVER_URL}/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content:
              "you are a helpful assistant and return responses in the required format. you stick to the rules",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: process.env.GAIANET_MODEL,
        temperature: temperature,
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

  private parseMarkdownResponse(response: GaiaNetResponse): ThemeAnalysis[] {
    try {
      const content = response.data.choices[0].message.content;
      console.log("[GaiaNet] Raw response:", content);

      // Split by numbered lines and parse each theme
      const themes = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0) // Remove empty lines
        .filter((line) => /^\d+\./.test(line)) // Get lines starting with numbers
        .map((line) => {
          console.log("[GaiaNet] Processing line:", line); // Debug log

          // Remove number and leading/trailing spaces
          const theme = line.replace(/^\d+\.\s*/, "").trim();

          return {
            theme,
            description: theme, // Using same text for description
            confidence: 0.9,
          };
        });

      console.log("[GaiaNet] Parsed themes:", themes);
      return themes;
    } catch (error) {
      console.error("[GaiaNet] Parse error:", error);
      console.error(
        "[GaiaNet] Content that failed:",
        response.data.choices[0].message.content
      );
      throw new Error(`Failed to parse response: ${error}`);
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

  // Add function to detect and remove similar sentences
  private removeSimilarSentences(text: string): string {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const uniqueSentences = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      let isDuplicate = false;

      // Compare with previous sentences
      for (const existing of uniqueSentences) {
        const similarity = this.calculateSimilarity(trimmed, existing);
        if (similarity > 0.8) {
          // 80% similarity threshold
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueSentences.push(trimmed);
      }
    }

    return uniqueSentences.join(" ");
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const intersection = words1.filter((word) => words2.includes(word));
    const union = new Set([...words1, ...words2]);

    return intersection.length / union.size;
  }

  public async generateStory(theme: string): Promise<string> {
    try {
      console.log("[GaiaNet] Writing story for theme:", theme);

      // First prompt for story writing
      const prompt_creative = `Write a short sci-fi story about the theme: ${theme}.
        The story should be 300 to 500 words. The story should have the following elements:
        - a protagonist or hero who is experiencing a problem or challenge. This can be a person, artificial being, alien.
        - Include at least one science fiction element (AI, space travel, future tech, etc.)
        - Story should have a clear challenge and resolution
        - Avoid repetitive sentences or phrases
        - Use varied sentence structures and vocabulary
        - Draw inspiration from classic sci-fi authors like Ursula K. Le Guin or Octavia Butler
        - the hero should experience an external, internal or philosophical challenge. An external challenge is something they have to achieve. An internal challenge is a conflict with themselves. A philosophical challenge is a broader challenge about the world, good vs evil.
        - the story should have science fiction elements. This can be a futuristic setting, alien life, advanced technology, etc.
        - The story should be written in an active voice. 
        - if the protagonist is a human, she is a woman or identifying as a woman. 
        - Create story gaps where the protagonist is experiencing a challenge and close the story gap with a solution.
        - Be clear what the problem is the protagonist is facing. 

        Story structure:
        1. Hook: Start with action or intrigue (no "Once upon a time")
        2. Challenge: Present a clear conflict (external, internal, or philosophical)
        3. Development: Show how the protagonist approaches the challenge
        4. Resolution: Resolve the conflict in a satisfying way

        Writing style:
        - Use active voice
        - Include sensory details
        - Vary sentence length and structure
        - Avoid clichés and common tropes
        - Create vivid imagery through specific details

        Domain knowledge:
        - Include relevant terminology from ${theme}'s domain
        - Consider social and ethical implications

        Do not star a story with "Once upon a time", or "the protagonist..."

        `;

      // Generate initial story
      const storyResponse = await this.makeRequest(prompt_creative, 0.5);
      const initialStory = storyResponse.data.choices[0].message.content;

      // Second prompt for editing
      const prompt_editor = `You are an editor. Review and improve this story:
        - Ensure strong opening hook
        - Remove any repetitive phrases
        - Enhance descriptive language
        - Check for consistent pacing
        
        Story to edit:
        ${initialStory}`;

      // Edit the story
      const editResponse = await this.makeRequest(prompt_editor, 0.9);

      // Add similarity check after editing
      const finalStory = editResponse.data.choices[0].message.content;
      const uniqueStory = this.removeSimilarSentences(finalStory);

      return uniqueStory;
    } catch (error) {
      console.error("[GaiaNet] Story generation error:", error);
      throw error;
    }
  }
}
