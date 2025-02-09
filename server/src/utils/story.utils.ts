import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { http } from "viem";
import { privateKeyToAccount, Address, Account } from "viem/accounts";
import { resolve, dirname } from "path";
import { config as dotenv } from "dotenv";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server directory
dotenv({ path: resolve(__dirname, "../../.env") });

console.log("Loaded env from:", resolve(__dirname, "../.env"));
console.log("WALLET_PRIVATE_KEY exists:", !!process.env.WALLET_PRIVATE_KEY);

if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error("WALLET_PRIVATE_KEY is required");
}

if (!process.env.RPC_PROVIDER_URL) {
  throw new Error("RPC_PROVIDER_URL is required");
}

const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
export const account: Account = privateKeyToAccount(privateKey);

const config: StoryConfig = {
  account: account,
  transport: http(process.env.RPC_PROVIDER_URL),
  chainId: "aeneid",
};
export const client = StoryClient.newClient(config);

// export const nftCollectionAddress = process.env.NFT_CONTRACT_ADDRESS
// nft collection is an nft contract that has been deployed to story before the start of the workshop to save time
// export const nftCollectionAddress = '0x60079B018d74216EeF9E1604Cd05e13eA49735AF'
// export const nonCommercialLicenseTermsid = '1'
