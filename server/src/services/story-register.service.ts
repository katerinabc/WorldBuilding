import { IpMetadata } from "@story-protocol/core-sdk";
import { client } from "../utils/story.utils.js";
import { uploadJSONToIPFS } from "../utils/uploadIpfs.js";
import { createHash } from "crypto";
import { Address } from "viem";
import dotenv from "dotenv";
dotenv.config();

// interface PILTerms {
//   commercial?: boolean;
//   commercialRevShare?: number; // In basis points (10000 = 1%)
//   derivativesAllowed?: boolean;
// }

interface StoryMetadata {
  title: string;
  description: string;
  owner: string;
}

interface RegistrationResponse {
  success: boolean;
  explorerUrl: string;
  ipId?: string;
  txHash?: string;
}

export async function register(
  metadata: StoryMetadata
): Promise<RegistrationResponse> {
  try {
    // Generate IP metadata
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
      title: metadata.title,
      description: metadata.description,
      attributes: [
        {
          key: "Rarity",
          value: "Legendary",
        },
      ],
    });

    const nftMetadata = {
      name: "Ownership NFT",
      description: "This is an NFT representing ownership of our IP asset.",
      image: "https://picsum.photos/200",
    };

    // Upload metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    const ipHash = createHash("sha256")
      .update(JSON.stringify(ipMetadata))
      .digest("hex");
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    const nftHash = createHash("sha256")
      .update(JSON.stringify(nftMetadata))
      .digest("hex");

    // Register with Story Protocol
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

    return {
      success: true,
      explorerUrl: `https://explorer.story.foundation/ipa/${response.ipId}`,
      ipId: response.ipId,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error("Error registering story:", error);
    throw error;
  }
}
