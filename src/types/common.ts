import { PublicKey } from "@solana/web3.js";

export type ResponseData = {
  success: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
export type RemainingAccount = {
  pubkey: PublicKey,
  isSigner: boolean,
  isWritable: boolean
}

export type SuccessResponseData = {
  publicKey: string,
  tokenAccount: string,
  wsolAccount: string,
  tx: string,
  tokenUrl: string,
}
