import { zeroAddress } from "viem";
import { client } from "./story.utils.js";

const main = async function () {
  // Create a new SPG NFT collection
  //
  // NOTE: Use this code to create a new SPG NFT collection. You can then use the
  // `newCollection.spgNftContract` address as the `spgNftContract` argument in
  // functions like `mintAndRegisterIpAssetWithPilTerms` in the
  // `simpleMintAndRegisterSpg.ts` file.
  //
  // You will mostly only have to do this once. Once you get your nft contract address,
  // you can use it in SPG functions.
  //
  const newCollection = await client.nftClient.createNFTCollection({
    name: "Test NFT",
    symbol: "TEST",
    isPublicMinting: true,
    mintOpen: true,
    mintFeeRecipient: zeroAddress,
    contractURI: "",
    txOptions: { waitForTransaction: true },
  });

  console.log(
    `New SPG NFT collection created at transaction hash ${newCollection.txHash}`
  );
  console.log(`NFT contract address: ${newCollection.spgNftContract}`);
};

main();

// console output
// Environment variables: { WALLET_PRIVATE_KEY: 'exists', RPC_PROVIDER_URL: 'exists' }
// New SPG NFT collection created at transaction hash 0xdfdb7deb930584e8d025b80c35ff0bcbf6a05b66d0a79768c6d4d69a9dff77fe
// NFT contract address: 0x0274A13dF70f4c1BB7f5C87b83Ea2a71660b3342
