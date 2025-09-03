import BN from "bn.js";

export const defaultMintButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
};

export const defaultRefundButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
}

export const defaultInformationStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '12px',
}

export const defaultGenerateURCStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '14px',
}

export const defaultFlipflopLogoStyle = {
  display: 'flex',
  justifyContent: 'center',
}

export type TokenMetadata = {
  name: string;
  symbol: string;
  uri: string;
  decimals?: number;
}

export type InitializeTokenConfig = {
  targetEras: BN;
  epochesPerEra: BN;
  targetSecondsPerEpoch: BN;
  reduceRatio: BN;
  initialMintSize: BN;
  initialTargetMintSizePerEpoch: BN;
  feeRate: BN;
  liquidityTokensRatio: BN;
  startTimestamp?: BN;
}
