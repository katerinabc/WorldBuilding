// NOT NEEDED as we are minting and registring the IP in one step

// import { StoryClient, StoryConfig} from '@story-protocol/core-sdk'
// import { http } from 'viem'
// import { privateKeyToAccount, Address, Account } from "viem/accounts";
// // import { createWalletClient, createPublicClient, Address, Account } from "viem";

// // import { defaultNftContractAbi } from ".defaultNftContractAbi";

// const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
// export const account: Account = privateKeyToAccount(privateKey);

// const config: StoryConfig  = {
//   account: account,
//   transport: http(process.env.RPC_PROVIDER_URL),
//   chain: 'aeneid',
// }

// export const client = StoryClient.newClient(config)

// // export async function mintNFT(
// //   to: Address,
// //   uri: string
// // ): Promise<number | undefined> {
// //   const { request } = await PublicClient.simulateContract({
// //     address: ProcessingInstruction.env.NFT_CONTRACT_ADDRESS as Address,
// //     functionName: "mintNFT",
// //     args: [to, uri],
// //     abi: defaultNftContractAbi,
// //   });
// //   const hash = await waleltClient.writeContract(request);
// //   const { logs } = await PublicClient.waitForTransactionReceipt({
// //     hash,
// //   });
// //   if (logs[0].topics[3]) {
// //     return parseInt(logs[0].topics[3], 16);
// //   }
// // }
