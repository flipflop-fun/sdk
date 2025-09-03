import { PublicKey } from "@solana/web3.js";
import { NetworkConfig, NetworkConfigs } from "./types/common";
import BN from "bn.js";
import { InitializeTokenConfig } from "./types/styles";

// PDA Seeds
export const METADATA_SEED = "metadata";
export const MINT_SEED = "fair_mint";
export const CONFIG_DATA_SEED = "config_data";
export const REFERRAL_SEED = "referral";
export const REFUND_SEEDS = "refund";
export const SYSTEM_CONFIG_SEEDS = "system_config_v1.1";
export const REFERRAL_CODE_SEED = "referral_code";
export const CODE_ACCOUNT_SEEDS = "code_account";

export const MAX_URC_USAGE_COUNT = 50;
export const MAX_AVATAR_SIZE = 250 * 1024;

export const NETWORK_CONFIGS: NetworkConfigs = {
  devnet: {
    frontendUrl: "https://test.flipflop.plus",
    apiBaseUrl: 'https://api-dev.flipflop.plus',
    irysGatewayUrl: "https://gateway.irys.xyz",
    // programId: "FLipzZfErPUtDQPj9YrC6wp4nRRiVxRkFm3jdFmiPHJV",
    systemDeployer: new PublicKey('DJ3jvpv6k7uhq8h9oVHZck6oY4dQqY1GHaLvCLjSqxaD'),
    allowOwnerOffCurveForProtocolFeeAccount: false, // if protocol fee account is not pda account, set false
    tokenMetadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
    cpSwapProgram: new PublicKey("CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW"), // devnet
    cpSwapConfigAddress: new PublicKey("9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6"), // find address on devnet
    createPoolFeeReceive: new PublicKey("G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2"), // find address on devnet
    addressLookupTableAddress: new PublicKey("EebRqpLtUgjX17pJJNNbd6ngtYa34VGa51oYsibwJRXy"),
    launchRuleAccount: new PublicKey("G9KkZg3MQen877QPmNwvTFzfm9gY7fzQEdhbrHbpCXQj"),
  } as NetworkConfig,
  mainnet: {
    frontendUrl: "https://app.flipflop.plus",
    apiBaseUrl: 'https://api.flipflop.plus',
    irysGatewayUrl: "https://gateway.irys.xyz",
    // programId: "FLipzZfErPUtDQPj9YrC6wp4nRRiVxRkFm3jdFmiPHJV",
    systemDeployer: new PublicKey('DJ3jvpv6k7uhq8h9oVHZck6oY4dQqY1GHaLvCLjSqxaD'), // must be DJ3jvpv6k7uhq8h9oVHZck6oY4dQqY1GHaLvCLjSqxaD, this is the original deployer
    allowOwnerOffCurveForProtocolFeeAccount: true, // if protocol fee account is pda account, set true
    tokenMetadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
    cpSwapProgram: new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"),
    cpSwapConfigAddress: new PublicKey("D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"),
    createPoolFeeReceive: new PublicKey("DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"),
    addressLookupTableAddress: new PublicKey("7DK7pmNkUeeFB3yxt6bJcPCWcG4L3AdCe2WZaBguy9sq"),
    launchRuleAccount: new PublicKey("G9KkZg3MQen877QPmNwvTFzfm9gY7fzQEdhbrHbpCXQj"),
  } as NetworkConfig,
};

export const DEFAULT_PARAMS = {
  standard: {
    // must be same as program default params
    targetEras: new BN('1'),
    epochesPerEra: new BN('200'),
    targetSecondsPerEpoch: new BN('2000'),
    reduceRatio: new BN('50'),
    initialMintSize: new BN('20000000000000'),
    initialTargetMintSizePerEpoch: new BN('200000000000000'),
    feeRate: new BN('250000000'),
    liquidityTokensRatio: new BN('20'),
  },
  meme: {
    // config for mainnet, 100 - 557 SOL
    targetEras: new BN('1'),
    epochesPerEra: new BN('200'),
    targetSecondsPerEpoch: new BN('2000'),
    reduceRatio: new BN('75'),
    initialMintSize: new BN('100000000000000'),
    initialTargetMintSizePerEpoch: new BN('1000000000000000'),
    feeRate: new BN('50000000'),
    liquidityTokensRatio: new BN('20'),
  },
} as Record<string, InitializeTokenConfig>;
