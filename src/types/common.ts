import { BN } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

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

export type ConfigData = {
  admin: PublicKey,
  feeRate: BN,
  mintSizeEpoch: BN,
}
// export type InitiazlizedTokenData = {
//   id: string;
//   txId: string;
//   admin: string;
//   tokenId: string;
//   mint: string;
//   configAccount: string;
//   metadataAccount: string;
//   tokenVault: string;
//   timestamp: string;
//   status: number;
//   metadataTimestamp: string;
//   valueManager: string;
//   wsolVault: string;
//   graduateEpoch: string;

//   // TokenMetadata
//   tokenName: string;
//   tokenSymbol: string;
//   tokenUri: string;

//   // TokenMintState
//   supply: string;
//   currentEra: string;
//   currentEpoch: string;
//   elapsedSecondsEpoch: string;
//   startTimestampEpoch: string;
//   lastDifficultyCoefficientEpoch: string;
//   difficultyCoefficientEpoch: string;
//   mintSizeEpoch: string;
//   quantityMintedEpoch: string;
//   targetMintSizeEpoch: string;
//   totalMintFee: string;
//   totalReferrerFee: string;
//   totalTokens: string;

//   // InitializeTokenConfigData
//   targetEras: string;
//   epochesPerEra: string;
//   targetSecondsPerEpoch: string;
//   reduceRatio: string;
//   initialMintSize: string;
//   initialTargetMintSizePerEpoch: string;
//   feeRate: string;
//   liquidityTokensRatio: string;
//   startTimestamp: string;

//   tokenMetadata?: TokenMetadataIPFS;
// }

export type TokenMetadataIPFS = {
  name?: string;
  symbol?: string;
  image?: string;
  header?: string;
  description?: string;
  extensions?: TokenMetadataExtensions;
  attributes?: string[];
}

export type TokenMetadataExtensions = {
  twitter?: string;
  discord?: string;
  website?: string;
  github?: string;
  medium?: string;
  telegram?: string;
}

export type MintButtonProps = {
  network: keyof NetworkConfigs;
  rpc: string;
  mintAddress: string;
  urcCode: string;
  wallet: AnchorWallet;
  connection: Connection;
  showRefundButton: boolean;
  showUrcButton: boolean;
  mintButtonTitle?: string;
  mintButtonStyle?: Object;
  refundButtonStyle?: Object;
  refundButtonTitle?: string;
  informationStyle?: Object;
  generateURCStyle?: Object;
  flipflopLogoStyle?: Object;
  onMintStart?: () => void;
  onMintError?: (error: string) => void;
  onMintSuccess?: (data: SuccessResponseData) => void;
  onRefundStart?: () => void;
  onRefundError?: (error: string) => void;
  onRefundSuccess?: (data: SuccessResponseData) => void;
};

export type RefundButtonProps = {
  network: keyof NetworkConfigs;
  mintAddress: string;
  wallet: AnchorWallet;
  connection: Connection;
  tokenInfo: {tokenName: string, tokenSymbol: string};
  buttonTitle?: string;
  buttonStyle?: Object;
  informationStyle?: Object;
  generateURCStyle?: Object;
  flipflopLogoStyle?: Object;
  onStart?: () => void;
  onError?: (error: string) => void;
  onSuccess?: (data: SuccessResponseData) => void;
};

export interface NetworkConfig {
  programId: string,
  // solanaRpc: string;
  frontendUrl: string;
  systemDeployer: PublicKey;
  protocolFeeAccount: PublicKey;
  tokenMetadataProgramId: PublicKey;
  cpSwapProgram: PublicKey;
  cpSwapConfigAddress: PublicKey;
  createPoolFeeReceive: PublicKey;
  addressLookupTableAddress: PublicKey;
}

export interface NetworkConfigs {
  devnet: NetworkConfig;
  mainnet: NetworkConfig;
}