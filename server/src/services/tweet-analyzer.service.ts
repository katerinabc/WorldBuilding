import { BaseService } from "./base.service.js";
// import { TwitterService } from "./twitter.service.js";
import { GaiaNetService } from "./gaianet.service.js";
import { Tweet } from "agent-twitter-client";

export interface ThemeAnalysis {
  theme: string;
  confidence: number;
}

export class TweetAnalyzerService extends BaseService {
  private static instance: TweetAnalyzerService;
  private gaiaService: GaiaNetService;

  private constructor() {
    super();
    this.gaiaService = GaiaNetService.getInstance();
  }

  public static getInstance(): TweetAnalyzerService {
    if (!TweetAnalyzerService.instance) {
      TweetAnalyzerService.instance = new TweetAnalyzerService();
    }
    return TweetAnalyzerService.instance;
  }

  public async analyzeTweets(tweets: Tweet[]): Promise<ThemeAnalysis[]> {
    try {
      console.log(`[INFO] Analyzing ${tweets.length} tweets`);

      // Log each tweet with counter and handle undefined text
      tweets.forEach((tweet: Tweet, index: number) => {
        const tweetText = tweet.text || ""; // Handle undefined text
        console.log(
          `[Tweet ${index + 1}/${tweets.length}]:`,
          tweetText.substring(0, 50) + "..."
        );
      });

      // Prepare data for analysis, filtering out tweets with no text
      const tweetText = tweets
        .map((t: Tweet) => t.text || "")
        .filter((text) => text.length > 0)
        .join("\n");

      console.log(`[INFO] Total characters to analyze: ${tweetText.length}`);

      // Use GaiaNet for theme analysis
      console.log("\n[INFO] Starting GaiaNet theme analysis");
      const startTime = Date.now();
      const themes = await this.gaiaService.analyzeThemes(tweetText);
      const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(
        `\n[INFO] Theme analysis completed in ${analysisTime} seconds`
      );
      return themes;
    } catch (error) {
      console.error("[ERROR] Tweet analysis failed:", error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    console.log("TweetAnalyzer service started");
  }

  public async stop(): Promise<void> {
    console.log("TweetAnalyzer service stopped");
  }
}
