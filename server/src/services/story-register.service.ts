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

  const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
  const ipHash = createHash("sha256")
    .update(JSON.stringify(ipMetadata))
    .digest("hex");
  const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
  const nftHash = createHash("sha256")
    .update(JSON.stringify(nftMetadata))
    .digest("hex");

  const response = await client.ipAsset.mintAndRegisterIp({
    spgNftContract: process.env.SPG_NFT_CONTRACT_ADDRESS as Address,
    allowDuplicates: true,
    ipMetadata: {
      ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
      nftMetadataHash: `0x${nftHash}`,
    },
    txOptions: { waitForTransaction: true },
  });

  console.log(
    `Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
  );
  console.log(
    `View on the explorer: https://explorer.story.foundation/ipa/${response.ipId}`
  );
}

register();
