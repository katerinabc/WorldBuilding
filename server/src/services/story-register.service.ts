import { IpMetadata } from "@story-protocol/core-sdk";
import { client } from "../utils/story.utils.js";
import { uploadJSONToIPFS } from "../utils/uploadIpfs.js";
import { createHash } from "crypto";
import { Address } from "viem";
import dotenv from "dotenv";
// import axios from "axios";
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
  theme: string;
  image: string;
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
    console.log("Registering story with metadata:", {
      title: metadata.title,
      descriptionLength: metadata.description?.length,
      owner: metadata.owner,
    });

    // Generate IP metadata
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
      title: metadata.title,
      description: metadata.description,
      ipType: "text",
      attributes: [
        {
          key: "Story",
          value: metadata.description,
        },
        {
          key: "Theme",
          value: metadata.theme,
        },
      ],
      creators: [
        {
          name: "Author",
          contributionPercent: 100,
          address: metadata.owner as Address,
        },
      ],
    });

    const nftMetadata = {
      name: metadata.title,
      description: `Ownership NFT for article: ${metadata.title} `,
      image: metadata.image,
      attributes: [
        {
          key: "Story",
          value: metadata.description,
        },
        {
          key: "Theme",
          value: metadata.theme,
        },
      ],
    };

    // Upload metadata to IPFS
    console.log("Uploading IP metadata to IPFS:", ipMetadata);
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    console.log("IP metadata IPFS hash:", ipIpfsHash);

    const ipHash = createHash("sha256")
      .update(JSON.stringify(ipMetadata))
      .digest("hex");

    console.log("Uploading NFT metadata to IPFS:", nftMetadata);
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    console.log("NFT metadata IPFS hash:", nftIpfsHash);

    const nftHash = createHash("sha256")
      .update(JSON.stringify(nftMetadata))
      .digest("hex");

    // Verify IPFS uploads
    // try {
    //   const ipfsResponse = await axios.get(`https://ipfs.io/ipfs/${ipIpfsHash}`);
    //   console.log("Verified IP metadata on IPFS:", ipfsResponse.data);

    //   const nftIpfsResponse = await axios.get(`https://ipfs.io/ipfs/${nftIpfsHash}`);
    //   console.log("Verified NFT metadata on IPFS:", nftIpfsResponse.data);
    // } catch (error) {
    //   console.error("Failed to verify IPFS uploads:", error);
    //   // Continue with registration anyway as IPFS gateway might be slow
    // }

    console.log(
      "checking ipfs url for metadata uri: ",
      `https://ipfs.io/ipfs/${ipIpfsHash}`
    );
    console.log(
      "checking ipfs url for nft metadata uri: ",
      `https://ipfs.io/ipfs/${nftIpfsHash}`
    );

    // // check balance
    // const balance = await checkStoryBalance(client);
    // console.log(`Proceeding with registration. Current balance: ${balance} ETH`);

    // Register with Story Protocol
    //tODO: REPALCE WITH registerIpAndAttachPilTerms
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

// async function checkStoryBalance(client: any) {
//   try {
//     const balance = await client.provider.getBalance(client.account.address);
//     const formattedBalance = Number(balance) / 1e18; // Convert from wei to ETH
//     console.log("Story Protocol Balance:", formattedBalance, "ETH");

//     if (formattedBalance < 0.1) {
//       throw new Error(`Insufficient balance for Story Protocol operations. Current balance: ${formattedBalance} ETH. Please get test ETH from the Story Protocol Discord faucet.`);
//     }

//     return formattedBalance;
//   } catch (error) {
//     console.error("Failed to check balance:", error);
//     throw error;
//   }
// }
