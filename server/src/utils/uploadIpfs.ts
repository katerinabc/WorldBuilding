import { PinataSDK } from "@pinata-web3";

// initate pinata sdk.in the docs this is inside the async function
const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT,
});

// function to upload IP and NFT metadata object to ipfs
// store json created in metadata in register.ts in ipfs and return url
// json is nft metadata and ip metadata
export async function uploadJSONToIPFS(
  jsonMetadata: Record<string, unknown>
): Promise<string> {
  const { IpfsHash } = await pinata.upload.json(jsonMetadata);
  return IpfsHash;
}
