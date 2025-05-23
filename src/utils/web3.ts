import { PublicKey, Connection, ComputeBudgetProgram, AddressLookupTableAccount, VersionedTransaction, TransactionMessage, AccountInfo, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { CODE_ACCOUNT_SEEDS, CONFIG_DATA_SEED, cpSwapConfigAddress, cpSwapProgram, createPoolFeeReceive, FLIPFLOP_BASE_URL, METADATA_SEED, PROTOCOL_FEE_ACCOUNT, REFERRAL_CODE_SEED, REFERRAL_SEED, REFUND_SEEDS, SYSTEM_CONFIG_SEEDS, SYSTEM_DEPLOYER, TOKEN_METADATA_PROGRAM_ID } from "../config";
import * as anchor from '@coral-xyz/anchor';
import { FairMintToken } from '../types/fair_mint_token';
import idl from "../idl/fair_mint_token.json";
import { Buffer } from 'buffer';
import { RemainingAccount, ResponseData, SuccessResponseData } from "../types/common";
import { BN } from "@coral-xyz/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAuthAddress, getOrcleAccountAddress, getPoolAddress, getPoolLpMintAddress, getPoolVaultAddress } from "./pda";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { RENT_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2';
import { AnchorWallet } from "@solana/wallet-adapter-react";

export const BN_MILLION = new BN(1000000);
export const BN_LAMPORTS_PER_SOL = new BN(1000000000);

export const connection = new Connection(
  'https://api.devnet.solana.com'
);

export const updateProgramProvider = (keypair: anchor.web3.Keypair) => {
  const newProvider = new anchor.AnchorProvider(
    connection as unknown as anchor.web3.Connection,
    {
      publicKey: keypair.publicKey,
      signTransaction: async (tx) => {
        if ('partialSign' in tx) {
          tx.partialSign(keypair);
        } else {
          tx.sign([keypair]);
        }
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => {
          if ('partialSign' in tx) {
            tx.partialSign(keypair);
          } else {
            tx.sign([keypair]);
          }
        });
        return txs;
      },
    },
    { commitment: 'confirmed' }
  );
  
  return {
    provider: newProvider,
    program: new anchor.Program<FairMintToken>(idl, newProvider),
  }
};

// export const program = new anchor.Program<FairMintToken>(idl, provider);

export const configAccount = (program: anchor.Program<FairMintToken>, mintAccount: PublicKey) => PublicKey.findProgramAddressSync(
  [Buffer.from(CONFIG_DATA_SEED), mintAccount.toBuffer()],
  program.programId,
)[0];

export const systemConfigAccount = (program: anchor.Program<FairMintToken>, systemMangerAccount: PublicKey) => PublicKey.findProgramAddressSync(
  [Buffer.from(SYSTEM_CONFIG_SEEDS), systemMangerAccount.toBuffer()],
  program.programId,
)[0];

export const referralAccount = (program:anchor.Program<FairMintToken>, mintAccount: PublicKey, refAccount: PublicKey) => PublicKey.findProgramAddressSync(
  [Buffer.from(REFERRAL_SEED), mintAccount.toBuffer(), refAccount.toBuffer()],
  program.programId,
)[0];

export const getReferrerCodeHash = (program:anchor.Program<FairMintToken>, code: string): PublicKey => PublicKey.findProgramAddressSync(
    [Buffer.from(REFERRAL_CODE_SEED), Buffer.from(code)],
    program.programId,
  )[0];

export const getReferralDataByCodeHash = async (program:anchor.Program<FairMintToken>, codeHash: PublicKey): Promise<ResponseData> => {
  const [codeAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CODE_ACCOUNT_SEEDS), codeHash.toBuffer()],
    program.programId,
  );

  const codeAccountInfo = await connection.getAccountInfo(codeAccountPda);
  if (!codeAccountInfo) {
    return {
      success: false,
      message: 'Code account does not exist'
    }
  }
  const codeAccountData = await program.account.codeAccountData.fetch(codeAccountPda);
  const referralAccountPda = codeAccountData.referralAccount;

  const referralAccountInfo = await connection.getAccountInfo(referralAccountPda);
  if (!referralAccountInfo) {
    return {
      success: false,
      message: 'Referral account does not exist'
    }
  }
  const referralAccountData = await program.account.tokenReferralData.fetch(referralAccountPda);
  return {
    success: true,
    data: {
      ...referralAccountData,
      referralAccount: referralAccountPda,
    }
  }
}

export const getTokenBalance = async (ata: PublicKey, connection: Connection): Promise<number | null> => {
  const account = await connection.getTokenAccountBalance(ata);
  return account.value.uiAmount;
}

export const getSystemConfig = async (program:anchor.Program<FairMintToken>): Promise<ResponseData> => {
  try {
    const [systemConfigAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SYSTEM_CONFIG_SEEDS), new PublicKey(SYSTEM_DEPLOYER).toBuffer()],
      program.programId,
    );
    const systemConfigData = await program.account.systemConfigData.fetch(systemConfigAccountPda);
    return {
      success: true,
      data: {
        systemConfigData,
        systemConfigAccountPda,
      }
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: 'Error getting system config'
    }
  }
}

export function getFeeValue(
  feeRate: BN,
  difficultyCoefficient: number,
  referrerAtaBalance: BN,
  totalSupply: BN
): [BN, BN] {
  // For special processing in BN, we scale by 1000000
  const SCALE = BN_MILLION; // new BN(1000000);

  // Calculate balance ratio with scale
  console.log("referrerAtaBalance:", referrerAtaBalance.toString());
  console.log("totalSupply:", totalSupply.toString());
  const balanceRatioScaled = totalSupply.gt(new BN(0)) ? referrerAtaBalance.mul(SCALE).div(totalSupply) : new BN(0);
  const balanceRatio = balanceRatioScaled.toNumber() / SCALE.toNumber();
  console.log("balance_ratio:", balanceRatio);

  // Determine discount rate and convert to scaled BN
  let discountRateScaled: BN;
  if (balanceRatio >= 0.01) {
    discountRateScaled = new BN(250000); // 0.25 * SCALE
  } else if (balanceRatio >= 0.008) {
    discountRateScaled = new BN(200000); // 0.20 * SCALE
  } else if (balanceRatio >= 0.006) {
    discountRateScaled = new BN(150000); // 0.15 * SCALE
  } else if (balanceRatio >= 0.004) {
    discountRateScaled = new BN(100000); // 0.10 * SCALE
  } else if (balanceRatio >= 0.002) {
    discountRateScaled = new BN(50000);  // 0.05 * SCALE
  } else {
    discountRateScaled = new BN(0);
  }
  const discountRate = discountRateScaled.toNumber() / SCALE.toNumber();
  console.log("discount_rate:", discountRate);

  // Convert difficultyCoefficient to scaled BN
  const difficultyScaled = new BN(Math.floor(difficultyCoefficient * SCALE.toNumber()));

  // Calculate fee: feeRate * (1 + discountRate/difficultyCoefficient - discountRate)
  const one = SCALE;
  const discountByDifficulty = discountRateScaled.mul(SCALE).div(difficultyScaled);
  const scaledMultiplier = one.add(discountByDifficulty).sub(discountRateScaled);
  const fee = feeRate.mul(scaledMultiplier).div(SCALE);

  console.log(
    "fee:",
    `${1} + ${discountRate} / ${difficultyCoefficient} - ${discountRate} = ${fee.toString()}`
  );

  // Calculate code sharer reward: 0.2 * feeRate * discountRate * (1 - 1/difficultyCoefficient)
  const rewardBase = new BN(200000); // 0.2 * SCALE
  const difficultyFactor = SCALE.sub(SCALE.mul(SCALE).div(difficultyScaled));
  const rewardMultiplier = rewardBase.mul(discountRateScaled).mul(difficultyFactor);
  const codeSharerReward = feeRate.mul(rewardMultiplier).div(SCALE.mul(SCALE).mul(SCALE));

  return [fee, codeSharerReward];
}

export const numberStringToBN = (decimalStr: string): BN => {
  return new BN(decimalStr.replace(/[,\s]/g, '').split('.')[0] || '0');
};

// Create medatata PDA
export const metadataAccountPda = (mintAccount: PublicKey) => PublicKey.findProgramAddressSync(
  [
    Buffer.from(METADATA_SEED),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    mintAccount.toBuffer()
  ],
  TOKEN_METADATA_PROGRAM_ID,
)[0];

// export const fetchReferralData = async (inputCode: string): Promise<ResponseData> => {
//   try {
//     const codeHash = getReferrerCodeHash(inputCode);
//     const result = await getReferralDataByCodeHash(codeHash);
//     if (!result.success) {
//       return {
//         success: false,
//         message: result.message,
//       }
//     }
//     if (result.data === null || result.data === undefined) {
//       return {
//         success: false,
//         message: 'Referral data not found',
//       }
//     }
//     const ataBalance = await getTokenBalance(result.data.referrerAta, connection) as number;

//     const systemConfig = await getSystemConfig();
//     if (!systemConfig.success) {
//       return {
//         success: false,
//         message: systemConfig.message,
//       }
//     }
//     if (systemConfig.data === null || systemConfig.data === undefined) {
//       return {
//         success: false,
//         message: 'System config not found',
//       }
//     }

//     return({
//       success: true,
//       data:{
//         ...result.data,
//         ...systemConfig.data,
//         tokenBalance: ataBalance,
//         // acturalPay: acturalPay,
//         // urcProviderBonus: urcProviderBonus,
//       }});
//   } catch (error: unknown) {
//     console.error('Error fetching referral data:', error);
//     return {
//       success: false,
//       message: 'Error fetching referral data',
//     }
//   }
// }

export const getSolanaBalance = async (publicKey: PublicKey, connection: Connection): Promise<number> => {
  return await connection.getBalance(publicKey);
}

export const compareMints = (mintA: PublicKey, mintB: PublicKey): number => {
  const bufferA = mintA.toBuffer();
  const bufferB = mintB.toBuffer();
  
  for (let i = 0; i < bufferA.length; i++) {
    if (bufferA[i] !== bufferB[i]) {
      return bufferA[i] - bufferB[i];
    }
  }
  return 0;
}

export async function getLegacyTokenMetadata(metadataAccountInfo: AccountInfo<Buffer> | null): Promise<ResponseData> {
  try {
    if (!metadataAccountInfo) {
      return {
        success: false,
        message: 'Metadata account not found',
      }
    }
    const data = metadataAccountInfo.data;
    
    // Parse key (1 byte)
    const key = data[0];
    
    // Parse update authority (32 bytes)
    const updateAuthority = new PublicKey(data.slice(1, 33));
    
    // Parse mint (32 bytes)
    const mint = new PublicKey(data.slice(33, 65));
    
    // Parse name
    const nameLength = data.readUInt32LE(65);
    let currentPos = 69;
    const name = data.slice(currentPos, currentPos + nameLength).toString('utf8');
    currentPos += nameLength;
    
    // Parse symbol
    const symbolLength = data.readUInt32LE(currentPos);
    currentPos += 4;
    const symbol = data.slice(currentPos, currentPos + symbolLength).toString('utf8');
    currentPos += symbolLength;
    
    // Parse uri
    const uriLength = data.readUInt32LE(currentPos);
    currentPos += 4;
    const uri = data.slice(currentPos, currentPos + uriLength).toString('utf8');
    currentPos += uriLength;
    
    // Parse seller fee basis points (2 bytes)
    const sellerFeeBasisPoints = data.readUInt16LE(currentPos);
    currentPos += 2;
    
    // Parse creators
    const hasCreators = data[currentPos];
    currentPos += 1;
    
    const creators = [];
    if (hasCreators) {
      const creatorsLength = data.readUInt32LE(currentPos);
      currentPos += 4;
      for (let i = 0; i < creatorsLength; i++) {
        const creatorAddress = new PublicKey(data.slice(currentPos, currentPos + 32));
        currentPos += 32;
        const verified = data[currentPos] === 1;
        currentPos += 1;
        const share = data[currentPos];
        currentPos += 1;
        creators.push({ address: creatorAddress, verified, share });
      }
    }
    
    // Parse collection
    const hasCollection = data[currentPos];
    currentPos += 1;
    let collection = null;
    if (hasCollection) {
      const collectionKey = new PublicKey(data.slice(currentPos, currentPos + 32));
      currentPos += 32;
      const verified = data[currentPos] === 1;
      currentPos += 1;
      collection = { key: collectionKey, verified };
    }
        
    // Finally, parse isMutable
    const isMutable = data[currentPos] === 1;
    
    // Log the parsed metadata
    const result = {
      key,
      updateAuthority: updateAuthority.toBase58(),
      mint: mint.toBase58(),
      data: {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        creators: creators.map(c => ({
          address: c.address.toBase58(),
          verified: c.verified,
          share: c.share
        })),
      },
      isMutable,
      collection: collection ? {
        key: collection.key.toBase58(),
        verified: collection.verified
      } : null,
    };
    return {
      success: true,
      data: result,
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      success: false,
      message: 'Error fetching metadata: ' + error.message,
    }
  }
}

export const processVersionedTransaction = async (
  versionedTx: VersionedTransaction,
  connection: Connection,
  wallet: AnchorWallet,
  latestBlockhash: BlockhashWithExpiryBlockHeight,
  confirmLevel: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
) => {
  try {
    versionedTx.message.recentBlockhash = latestBlockhash.blockhash;
    const signedTx = await wallet.signTransaction(versionedTx);
    const serializedTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(serializedTx, {
      skipPreflight: true,
    });
    const status = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, confirmLevel);

    if (status.value.err) {
      return {
        success: false,
        message: `Mint failed: ${JSON.stringify(status.value.err)}`,
      }
    }
    return {
      success: true,
      message: `Mint succeeded`,
      data: {
        tx: signature,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    }
  }
}

export const mintBy = async (
  program: anchor.Program<FairMintToken>,
  mintAccount: PublicKey,
  configAccount: PublicKey,
  referralAccount: PublicKey,
  referrerMain: PublicKey,
  tokenMetadata: { name: string, symbol: string },
  codeHash: PublicKey,
  account: AnchorWallet,
  systemConfigAccount: PublicKey,
  connection: Connection,
  lookupTableAddress: PublicKey,
  protocolFeeAccount: PublicKey,
): Promise<ResponseData> => {
  // check balance SOL
  const balance = await getSolanaBalance(account.publicKey, connection);
  if (balance == 0) {
    return {
      success: false,
      message: "Balance not enough",
    }
  }

  const destinationAta = await getAssociatedTokenAddress(new PublicKey(mintAccount), account.publicKey, false, TOKEN_PROGRAM_ID);
  const destinationAtaInfo = await connection.getAccountInfo(destinationAta);

  const destinationWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, account.publicKey, false, TOKEN_PROGRAM_ID);
  const destinationWsolInfo = await connection.getAccountInfo(destinationWsolAta);

  const mintTokenVaultAta = await getAssociatedTokenAddress(
    mintAccount,
    mintAccount,
    true,
    TOKEN_PROGRAM_ID
  );

  const tokenVaultAta = await getAssociatedTokenAddress(
    mintAccount,
    configAccount,
    true,
    TOKEN_PROGRAM_ID
  );

  const referrerAta = await getAssociatedTokenAddress(
    mintAccount,
    referrerMain,
    false,
    TOKEN_PROGRAM_ID
  );

  const [refundAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from(REFUND_SEEDS), mintAccount.toBuffer(), account.publicKey.toBuffer()],
    program.programId,
  );

  const referrerAccountInfo = await connection.getAccountInfo(referrerAta);
  if (referrerAccountInfo === null) {
    return {
      success: false,
      message: "Referrer ata not exist",
    }
  }

  const codeHashInReferralAccount = await program.account.tokenReferralData.fetch(referralAccount);
  if (codeHashInReferralAccount.codeHash.toBase58() !== codeHash.toBase58()) {
    return {
      success: false,
      message: "Code hash not match",
    }
  }

  const protocolWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, new PublicKey(PROTOCOL_FEE_ACCOUNT), false, TOKEN_PROGRAM_ID);

  const wsolVaultAta = await getAssociatedTokenAddress(NATIVE_MINT, configAccount, true, TOKEN_PROGRAM_ID);

  let token0Mint = mintAccount;
  let token1Mint = NATIVE_MINT;
  let token0Program = TOKEN_PROGRAM_ID;
  let token1Program = TOKEN_PROGRAM_ID;
  if(compareMints(token0Mint, token1Mint) > 0) {
    [token0Mint, token1Mint] = [token1Mint, token0Mint];
    [token0Program, token1Program] = [token1Program, token0Program];
  }
  
  const [authority] = getAuthAddress(cpSwapProgram);
  const [poolAddress] = getPoolAddress(cpSwapConfigAddress, token0Mint, token1Mint, cpSwapProgram);
  const [lpMintAddress] = getPoolLpMintAddress(poolAddress, cpSwapProgram);
  const [vault0] = getPoolVaultAddress(poolAddress, token0Mint, cpSwapProgram);
  const [vault1] = getPoolVaultAddress(poolAddress, token1Mint, cpSwapProgram);
  const [observationAddress] = getOrcleAccountAddress(poolAddress, cpSwapProgram);

  const creatorLpTokenAddress = getAssociatedTokenAddressSync(lpMintAddress, account.publicKey, false, TOKEN_PROGRAM_ID);
  const creatorToken0 = getAssociatedTokenAddressSync(token0Mint, account.publicKey, false, token0Program);
  const creatorToken1 = getAssociatedTokenAddressSync(token1Mint, account.publicKey, false, token1Program);

  const context = {
    mint: mintAccount,
    destination: destinationAta,
    destinationWsolAta: destinationWsolAta,
    refundAccount: refundAccount,
    user: account.publicKey,
    configAccount: configAccount,
    systemConfigAccount: systemConfigAccount,
    mintTokenVault: mintTokenVaultAta,
    tokenVault: tokenVaultAta,
    wsolVault: wsolVaultAta,
    wsolMint: NATIVE_MINT,
    referrerAta: referrerAta,
    referrerMain: referrerMain,
    referralAccount: referralAccount,
    protocolFeeAccount,
    protocolWsolVault: protocolWsolAta,
    poolState: poolAddress,
    ammConfig: cpSwapConfigAddress,
    cpSwapProgram: cpSwapProgram,
    token0Mint: token0Mint,
    token1Mint: token1Mint,
  };

  // =============== Use RemainingAccounts for initializing pool accounts, total 21 accounts ===============
  const remainingAccounts: RemainingAccount[] = [{
    pubkey: cpSwapProgram, // <- 1
    isWritable: false,
    isSigner: false,
  }, {
    pubkey: account.publicKey, // <- 2
    isWritable: true,
    isSigner: true,
  }, {
    pubkey: cpSwapConfigAddress, // <- 3
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: authority, // <- 4
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: poolAddress, // <- 5
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: token0Mint, // <- 6
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: token1Mint, // <- 7
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: lpMintAddress, // <- 8
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: creatorToken0, // <- 9
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: creatorToken1, // <- 10
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: creatorLpTokenAddress, // <- 11
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: vault0, // <- 12
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: vault1, // <- 13
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: createPoolFeeReceive, // <- 14
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: observationAddress, // <- 15
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: TOKEN_PROGRAM_ID, // <- 16
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: token0Program, // <- 17
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: token1Program, // <- 18
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: ASSOCIATED_PROGRAM_ID, // <- 19
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: SYSTEM_PROGRAM_ID, // <- 20
    isWritable: true,
    isSigner: false,
  }, {
    pubkey: RENT_PROGRAM_ID, // <- 21
    isWritable: true,
    isSigner: false,
  }];
  // ===================================================================================
  const instructionSetComputerUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: 500000 }); // or use --compute-unit-limit 400000 to run solana-test-validator
  const instructionCreateWSOLAta = createAssociatedTokenAccountInstruction( // Create WSOL for user if don't has
    account.publicKey,
    destinationWsolAta,
    account.publicKey,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID
  );
  const instructionCreateTokenAta = createAssociatedTokenAccountInstruction( // Create token for user if don't has
    account.publicKey,
    destinationAta,
    account.publicKey,
    new PublicKey(mintAccount),
    TOKEN_PROGRAM_ID
  );

  // Create versioned transaction with LUT
  const accountInfo = await connection.getAccountInfo(lookupTableAddress);
  const lookupTable = new AddressLookupTableAccount({
    key: lookupTableAddress,
    state: AddressLookupTableAccount.deserialize(accountInfo!.data),
  });

  const ix = await program.methods
    .mintTokens(tokenMetadata.name, tokenMetadata.symbol, codeHash.toBuffer())
    .accounts(context)
    .remainingAccounts(remainingAccounts)
    .instruction();

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const instructions = [instructionSetComputerUnitLimit];
  if (destinationAtaInfo === null) instructions.push(instructionCreateTokenAta);
  if (destinationWsolInfo === null) instructions.push(instructionCreateWSOLAta);
  instructions.push(ix);

  const versionedTx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: account.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message([lookupTable])
  );
  try {
    const result = await processVersionedTransaction(versionedTx, connection, account, latestBlockhash, 'confirmed');
    if (!result.success) {
      return {
        success: false,
        message: result.message,
      }
    }
    return {
      success: true,
      data: {
        publicKey: account.publicKey.toBase58(),
        tokenAccount: destinationAta.toBase58(),
        wsolAccount: destinationWsolAta.toBase58(),
        tx: result.data?.tx,
        tokenUrl: `${FLIPFLOP_BASE_URL}/token/${mintAccount.toBase58()}`,
      } as SuccessResponseData
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return {
      success: false,
      message: e.message as string,
    }
  }
}

export const cleanMetadata = (metadata: { name: string, symbol: string, uri: string }) => {
  const cleaned = { ...metadata };
  for (const key in cleaned) {
    if (typeof cleaned[key as keyof typeof cleaned] === 'string') {
      // eslint-disable-next-line no-control-regex
      cleaned[key as keyof typeof cleaned] = (cleaned[key as keyof typeof cleaned] as string).replace(/\u0000/g, '');
    }
  }
  return cleaned;
};
