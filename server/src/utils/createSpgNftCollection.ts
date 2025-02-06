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

// import { zeroAddress } from "viem";
// import { client } from "./story.utils.js";

// async function createSpgNftCollection() {
//   // Create a new SPG NFT collection
//   //
//   // NOTE: Use this code to create a new SPG NFT collection. You can then use the
//   // `newCollection.spgNftContract` address as the `spgNftContract` argument in
//   // functions like `mintAndRegisterIpAssetWithPilTerms` in the
//   // `simpleMintAndRegisterSpg.ts` file.
//   //
//   // You will mostly only have to do this once. Once you get your nft contract address,
//   // you can use it in SPG functions.

//   try {
//     // Add balance check
//     const balance = await client.rpcClient.getBalance({
//       address: client.wallet.account.address
//     });
//     console.log("Wallet balance:", balance);
//     console.log("Using address:", client.wallet.account.address);

//     const newCollection = await client.nftClient.createNFTCollection({
//       name: "Test NFT",
//       symbol: "TEST",
//       isPublicMinting: true,
//       mintOpen: true,
//       mintFeeRecipient: zeroAddress,
//       contractURI: "",
//       txOptions: { waitForTransaction: true },
//     });

//     console.log(
//       `New SPG NFT collection created at transaction hash ${newCollection.txHash}`
//     );
//     console.log(`NFT contract address: ${newCollection.spgNftContract}`);
//   } catch (error) {
//     console.error("Detailed error:", error);
//     throw error;
//   }
// };

// createSpgNftCollection().catch(console.error);
