import { PublicKey } from "@solana/web3.js";

export const FAIR_MINT_PROGRAM_ID = '8GM2N7qQjzMyhqewu8jpDgzUh2BJbtBxSY1WzSFeFm6U';
export const SYSTEM_DEPLOYER = 'CXzddeiDgbTTxNnd1apeUGE7E1UAdvBoysf7c271AA79';
export const PROTOCOL_FEE_ACCOUNT = "CXzddeiDgbTTxNnd1apeUGE7E1UAdvBoysf7c271AA79";
export const addressLookupTableAddress = new PublicKey("EebRqpLtUgjX17pJJNNbd6ngtYa34VGa51oYsibwJRXy");
export const cpSwapProgram = new PublicKey("CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW"); // devnet
export const cpSwapConfigAddress = new PublicKey("9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6"); // find address on devnet
export const createPoolFeeReceive = new PublicKey("G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2"); // find address on devnet

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const METADATA_SEED = "metadata";
export const MINT_SEED = "fair_mint";
export const CONFIG_DATA_SEED = "config_data";
export const FREEZE_SEED = "freeze";
export const MINT_STATE_SEED = "mint_state";
export const REFERRAL_SEED = "referral";
export const REFUND_SEEDS = "refund";
export const SYSTEM_CONFIG_SEEDS = "system_config_v1.1";
export const REFERRAL_CODE_SEED = "referral_code";
export const CODE_ACCOUNT_SEEDS = "code_account";
export const MINT_VAULT_OWNER_SEEDS = "mint-vault-owner";
export const EXTRA_ACCOUNT_META_LIST = "extra-account-metas";

export const FLIPFLOP_BASE_URL = "https://test.flipflop.plus/token";