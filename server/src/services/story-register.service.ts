import { IpMetadata } from "@story-protocol/core-sdk";
import { client } from "../utils/story.utils.js";
import { uploadJSONToIPFS } from "../utils/uploadIpfs.js";
import { createHash } from "crypto";
import dotenv from "dotenv";
dotenv.config();

interface PILTerms {
  commercial?: boolean;
  commercialRevShare?: number; // In basis points (10000 = 1%)
  derivativesAllowed?: boolean;
}

interface StoryMetadata {
  title: string;
  owner: string;
  moduleType: "default" | "commercial" | "derivative";
  pilTerms: PILTerms;
}

interface RegistrationResponse {
  success: boolean;
  explorerUrl: string;
  ipId?: string;
  txHash?: string;
}

// basic metadata associated with article
async function register() {
  const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
    title: "My IP Asset",
    description: "This is a test IP asset",
    watermarkImg: "https://picsum.photos/200",
    attributes: [
      {
        key: "Rarity",
        value: "Legendary",
      },
    ],
  });

  const nftMetadata = {
    name: "ownership nft",
    description: "this is a test nft",
    image: "https://picsum.photos/200",
  };

  const ipfsHash = await uploadJSONToIPFS(ipMetadata);
  const ipHash = createHash("sha256").update(ipfsHash).digest("hex");
  const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
  const nftHash = createHash("sha256").update(nftIpfsHash).digest("hex");
}

register();
