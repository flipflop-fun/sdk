import { PublicKey } from "@solana/web3.js";
import { NetworkConfig, NetworkConfigs } from "./types/common";

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

export const NETWORK_CONFIGS: NetworkConfigs = {
  devnet: {
    frontendUrl: "https://test.flipflop.plus",
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

