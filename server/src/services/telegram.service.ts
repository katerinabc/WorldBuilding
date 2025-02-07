import { Bot, webhookCallback } from "grammy";
import { Context, session, SessionFlavor } from "grammy";
import { BaseService } from "./base.service.js";
import { register } from "./story-register.service.js";
import { GaiaNetService } from "./gaianet.service.js";
// import { ElizaService } from "./eliza.service.js";
import {
  // AnyType,
  getCollablandApiUrl,
  // getTokenMetadataPath,
  // MintResponse,
  // TokenMetadata,
} from "../utils.js";
// import fs from "fs";
import axios from "axios";
// import axios, { AxiosResponse, isAxiosError } from "axios";
// import { parse as jsoncParse } from "jsonc-parser";
// import path from "path";
// import { keccak256, getBytes, toUtf8Bytes } from "ethers";
import { TwitterService } from "./twitter.service.js";
// import { NgrokService } from "./ngrok.service.js";
import { TweetAnalyzerService } from "./tweet-analyzer.service.js";

// Add the interface
interface ThemeAnalysis {
  theme: string;
  // confidence: number;
}

// Define our session structure
interface SessionData {
  waitingFor?: "title" | "owner" | "image" | "theme";
  title?: string;
  owner?: string;
  image?: string;
  story?: string;
  analyzedThemes?: ThemeAnalysis[];
  theme?: string;
}

// Add session to context type
type MyContext = Context & SessionFlavor<SessionData>;

export class TelegramService extends BaseService {
  private static instance: TelegramService;
  private bot: Bot<MyContext>;
  private webhookUrl?: string;
  // private elizaService: ElizaService;
  // private nGrokService!: NgrokService;
  private twitterService?: TwitterService;
  private tweetAnalyzerService: TweetAnalyzerService;
  private gaiaService: GaiaNetService;

  private constructor(webhookUrl?: string) {
    super();
    this.gaiaService = GaiaNetService.getInstance();
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    if (webhookUrl != null) {
      this.webhookUrl = `${webhookUrl}/telegram/webhook`;
    }
    this.bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

    // Initialize session middleware
    this.bot.use(session({ initial: (): SessionData => ({}) }));

    // this.elizaService = ElizaService.getInstance(this.bot); // I'm not using Eliza right now.
    this.tweetAnalyzerService = TweetAnalyzerService.getInstance();
  }

  public static getInstance(webhookUrl?: string): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService(webhookUrl);
    }
    return TelegramService.instance;
  }

  public async setWebhook(webhookUrl: string): Promise<void> {
    this.webhookUrl = `${webhookUrl}/telegram/webhook`;
    await this.bot.api.setWebhook(this.webhookUrl);
    console.log("Telegram webhook set:", this.webhookUrl);
  }

  public getWebhookCallback() {
    return webhookCallback(this.bot, "express", {
      timeoutMilliseconds: 10 * 60 * 1000,
      onTimeout: "return",
    });
  }

  public async start(): Promise<void> {
    // @ts-expect-error - Keeping client for future Collab.Land API integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const client = axios.create({
      baseURL: getCollablandApiUrl(),
      headers: {
        "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
        "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
        "Content-Type": "application/json",
      },
      timeout: 5 * 60 * 1000,
    });
    try {
      //all command descriptions can be added here
      this.bot.api.setMyCommands([
        {
          command: "start",
          description: "Add any hello world functionality to your bot",
        },
        { command: "feed", description: "Feed the bot tweets" },
        { command: "copyright", description: "get your story copy-righted" },
      ]);
      // all command handlers can be registered here
      this.bot.command("start", (ctx) => ctx.reply("Hello! I'm here"));
      this.bot.catch(async (error) => {
        console.error("Telegram bot error:", error);
      });

      // required when starting server for telegram webooks
      // this.nGrokService = await NgrokService.getInstance();
      // in the original collab.land telegram.service.ts file this.nGrokService.getURl() was later called in the mint function
      try {
        // try starting the twitter service
        this.twitterService = await TwitterService.getInstance();
        await this.twitterService?.start();
        console.log(
          "Twitter Bot Profile:",
          JSON.stringify(this.twitterService.me, null, 2)
        );
      } catch (err) {
        console.log(
          "[WARN] [telegram.service] Unable to use twitter. Functionality will be disabled",
          err
        );
      }

      this.bot.command("feed", async (ctx) => {
        try {
          console.log("\n[FEED] Command received from:", ctx.from?.username);

          await ctx.reply(
            "Also agents need food. And we live of your thoughts. All the nastiest thoughts and most uplifting unicorns that you post online. Paste a twitter url and FEED ME!\n" +
              "You need to start the command with feed it. Like this:\n" +
              "feed it https://x.com/username"
          );
        } catch (error) {
          console.error("[FEED] Command error:", error);
          await ctx.reply(
            "Sorry, there was an error starting the feed process."
          );
        }
      });

      this.bot.command("copyright", async (ctx: MyContext) => {
        try {
          console.log("[COPYRIGHT] command received from:", ctx.from?.username);

          if (!ctx.message?.reply_to_message?.text) {
            await ctx.reply(
              "To copyright your story:\n" +
                "1. Post your story\n" +
                "2. Reply to your story with /copyright\n\n" +
                "This helps me know which story you want to register!"
            );
            return;
          }

          // Store the story in session
          ctx.session.story = ctx.message.reply_to_message.text;

          // Check for theme first
          if (!ctx.session.theme) {
            ctx.session.waitingFor = "theme";
            await ctx.reply(
              "Please provide a theme for your story. Reply with:\nTheme: your_theme"
            );
            return;
          }

          // If we have a theme, ask for title
          ctx.session.waitingFor = "title";
          await ctx.reply(
            "Let's register your story on Story Protocol.\n" +
              "What's the title? Please reply with:\n" +
              "Title: your title here"
          );
        } catch (error) {
          console.error("[COPYRIGHT] command error:", error);
          await ctx.reply("Sorry, there was an error. Please try again.");
        }
      });

      // After theme is set, continue with title
      this.bot.hears(/^Theme: (.+)$/i, async (ctx: MyContext) => {
        if (ctx.session.waitingFor !== "theme") return;

        if (ctx.match?.[1]) {
          ctx.session.theme = ctx.match[1].trim();
          ctx.session.waitingFor = "title";
          await ctx.reply(
            "Great! Now what's the title? Please reply with:\n" +
              "Title: your title here"
          );
        }
      });

      // Title handler
      this.bot.hears(/^Title: (.+)$/i, async (ctx: MyContext) => {
        if (ctx.session.waitingFor !== "title") return;

        if (ctx.match?.[1]) {
          ctx.session.title = ctx.match[1].trim();
          ctx.session.waitingFor = "owner";
          await ctx.reply(
            "Great! Now, what's the owner's wallet address? Reply with:\nOwner: wallet_address"
          );
        }
      });

      // Owner handler
      this.bot.hears(/^Owner: (.+)$/i, async (ctx: MyContext) => {
        if (ctx.session.waitingFor !== "owner") return;

        if (ctx.match?.[1]) {
          ctx.session.owner = ctx.match[1].trim();
          ctx.session.waitingFor = "image";
          await ctx.reply("Great! Now, please upload an image for your story.");
        }
      });

      // Image handler
      this.bot.on("message:photo", async (ctx: MyContext) => {
        if (ctx.session.waitingFor !== "image") return;

        try {
          if (!ctx.message?.photo) return;

          const photos = ctx.message.photo;
          const photo = photos[photos.length - 1];
          const file = await ctx.api.getFile(photo.file_id);
          const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

          ctx.session.image = fileUrl;

          // Proceed with registration
          await ctx.reply(
            `Registering your story with these details:\n` +
              `Title: ${ctx.session.title}\n` +
              `Story: ${(ctx.session.story ?? "").substring(0, 100)}...\n` +
              `Owner: ${ctx.session.owner}\n` +
              `Theme: ${ctx.session.theme}\n` +
              `Image: ✓ Uploaded`
          );

          const registrationResponse = await register({
            title: ctx.session.title!,
            description: ctx.session.story!,
            owner: ctx.session.owner!,
            theme: ctx.session.theme!,
            image: ctx.session.image!,
          });

          await ctx.reply(
            `Story registered successfully!\n` +
              `View on explorer: ${registrationResponse.explorerUrl}`
          );

          // Reset session
          ctx.session.waitingFor = undefined;
          ctx.session.title = undefined;
          ctx.session.owner = undefined;
          ctx.session.story = undefined;
          ctx.session.image = undefined;
          ctx.session.theme = undefined;
        } catch (error) {
          console.error("[IMAGE_UPLOAD] Error:", error);
          await ctx.reply("Sorry, there was an error processing your image.");
        }
      });

      this.bot.on("message:text", async (ctx) => {
        try {
          const text = ctx.message.text;
          console.log("\n[URL] Received message:", text);

          // Only process if it's a Twitter URL and not a command
          // More flexible version
          if (
            text.toLowerCase().trim().startsWith("feed it") &&
            text.includes("x.com/") &&
            !text.startsWith("/")
          ) {
            console.log("[URL] Twitter URL detected");

            // Extract username from URL
            const gettwitterurl = text.replace("feed it", "");
            const username = gettwitterurl.split("/").pop()?.replace("@", "");
            if (!username) {
              console.log("[URL] Could not extract username");
              await ctx.reply("Could not extract username from URL");
              return;
            }

            console.log("[URL] Extracted username:", username);
            await ctx.reply("Hmmmm nice human thoughts 🤤");

            try {
              // First get the user profile to get the numeric ID
              console.log(`[URL] Getting user profile for: ${username}`);
              const userProfile = await this.twitterService
                ?.getScraper()
                .getProfile(username);

              if (!userProfile || !userProfile.userId) {
                console.log("[URL] Could not find user profile");
                await ctx.reply("Could not find this Twitter profile");
                return;
              }

              console.log(`[URL] Found user ID: ${userProfile.userId}`);

              // Now get tweets using the numeric ID
              console.log(
                `[URL] Scraping tweets for user ID: ${userProfile.userId}`
              );
              const tweetResponse = await this.twitterService
                ?.getScraper()
                .getUserTweets(userProfile.userId, 100);
              const tweets = tweetResponse?.tweets || [];

              console.log(`[URL] Retrieved ${tweets.length} tweets`);

              if (tweets.length === 0) {
                console.log("[URL] No tweets found");
                await ctx.reply("No tweets found for this profile");
                return;
              }

              await ctx.reply(
                `Digesting ${tweets.length} posts. Ready in a moment... 🍽️`
              );

              console.log(`[URL] Starting theme analysis`);
              const themes =
                await this.tweetAnalyzerService.analyzeTweets(tweets);

              ctx.session.analyzedThemes = themes;

              console.log("[URL] Analysis complete. Themes:", themes);
              await ctx.reply("Spitting out those 5 themes for you! 🎯");

              const keyboard = themes.slice(0, 5).map((theme, index) => [
                {
                  text: `${index + 1}. ${theme.theme}`,
                  callback_data: `theme_${index}`,
                },
              ]);

              console.log("[URL] Sending themes to user");
              await ctx.reply("Pick your favorite theme:", {
                reply_markup: {
                  inline_keyboard: keyboard,
                },
              });
            } catch (error) {
              console.error("[URL] Error:", error);
              await ctx.reply(
                "Sorry, I had trouble reading those tweets. Please try again later."
              );
              return;
            }
          }
        } catch (error) {
          console.error("[URL] Error:", error);
          await ctx.reply(
            "Sorry, there was an error analyzing this Twitter profile."
          );
        }
      });

      // Add callback query handler for theme selection
      this.bot.on("callback_query", async (ctx) => {
        try {
          if (!ctx.callbackQuery.data?.startsWith("theme_")) return;

          if (!ctx.session.analyzedThemes) {
            await ctx.reply(
              "Sorry, I can't find the themes. Please try again."
            );
            return;
          }
          const themeIndex = parseInt(
            ctx.callbackQuery.data.replace("theme_", "")
          );
          const selectedTheme = ctx.session.analyzedThemes[themeIndex].theme;

          // Acknowledge the selection
          await ctx.answerCallbackQuery();
          await ctx.reply(
            `Writing a story about: ${selectedTheme}... 🖋️\nThis will for sure take a minute...`
          );

          // Generate and send story
          const story = await this.gaiaService.generateStory(selectedTheme);
          const storyMessage = await ctx.reply(story);

          // Wait a short moment to ensure order
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Send options as a reply to the story
          await ctx.reply(
            "This is the best I can do right now. You can ask me to write another story (just select a theme at the top) or copyright the story.",
            { reply_to_message_id: storyMessage.message_id }
          );
        } catch (error) {
          console.error("[Themed Selection] Error:", error);
          await ctx.reply(
            "I can't. I just can't. Give me a sec and try again."
          );
        }
      });
    } catch (error) {
      console.error("Failed to start Telegram bot:", error);
      throw error;
    }
  }

  public getBotInfo() {
    return this.bot.api.getMe();
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.api.deleteWebhook();
    } catch (error) {
      console.error("Error stopping Telegram bot:", error);
    }
  }
}
