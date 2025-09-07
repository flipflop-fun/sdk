import { PublicKey, Connection, ComputeBudgetProgram, AddressLookupTableAccount, VersionedTransaction, TransactionMessage, AccountInfo, BlockhashWithExpiryBlockHeight, Transaction } from "@solana/web3.js";
import { CODE_ACCOUNT_SEEDS, CONFIG_DATA_SEED, METADATA_SEED, MINT_SEED, NETWORK_CONFIGS, REFERRAL_CODE_SEED, REFERRAL_SEED, REFUND_SEEDS, SYSTEM_CONFIG_SEEDS } from "../config";
import * as anchor from '@coral-xyz/anchor';
import { FairMintToken } from '../types/fair_mint_token';
import { Buffer } from 'buffer';
import { NetworkConfig, NetworkConfigs, RemainingAccount, ResponseData, SuccessResponseData } from "../types/common";
import { BN } from "@coral-xyz/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAuthAddress, getOrcleAccountAddress, getPoolAddress, getPoolLpMintAddress, getPoolVaultAddress } from "./pda";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { RENT_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2';
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { InitializeTokenConfig, TokenMetadata } from "../types/styles";
import axios from 'axios';

export const BN_MILLION = new BN(1000000);
export const BN_LAMPORTS_PER_SOL = new BN(1000000000);

// Upload API URL builder
export const getUploadApiUrl = (network: keyof NetworkConfigs): string => `${NETWORK_CONFIGS[network].apiBaseUrl}/api/irys/upload`;

export type UploadContentType = 'avatar' | 'metadata';

/**
 * Upload content to storage service (Irys) via Flipflop API.
 * - For avatar upload, pass a File/Blob and set contentType to 'avatar'.
 * - For metadata upload, pass a JSON-able object or string and set contentType to 'metadata'.
 * Returns a ResponseData object. The API is expected to follow ResponseData shape.
 */
export async function uploadToStorage(
  network: keyof NetworkConfigs,
  payload: File,
  contentType: UploadContentType,
): Promise<ResponseData> {
  const url = getUploadApiUrl(network);

  const form = new FormData();
  // form.append('contentType', contentType);
  form.append('action', contentType as string);
  form.append('file', payload);

  // 在 uploadToStorage 函数中，将第44-51行改为：
  try {
    const res = await axios.post(url, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    const data = res.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: `${NETWORK_CONFIGS[network].irysGatewayUrl}/${data.fileInfo.itemId}`,
      };
    }
    throw new Error('Upload failed: ' + JSON.stringify(data));
  } catch (err: any) {
    return { success: false, message: err?.message || 'Upload failed' };
  }
}

export const connection = (rpc: string) => new Connection(
  rpc,
  'confirmed',
);

export const mintAccount = (program: anchor.Program<FairMintToken>, tokenName: string, tokenSymbol: string) => PublicKey.findProgramAddressSync(
  [Buffer.from(MINT_SEED), Buffer.from(tokenName), Buffer.from(tokenSymbol.toLowerCase())],
  program.programId
)[0];

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

export const refundAccountPda = (program:anchor.Program<FairMintToken>, mintAccount: PublicKey, userAccount: PublicKey) => PublicKey.findProgramAddressSync(
    [Buffer.from(REFUND_SEEDS), new PublicKey(mintAccount).toBuffer(), userAccount.toBuffer()],
    program.programId,
  )[0];


export const getReferralDataByCodeHash = async (
  rpc: string,
  program: anchor.Program<FairMintToken>,
  codeHash: PublicKey
): Promise<ResponseData> => {
  const [codeAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CODE_ACCOUNT_SEEDS), codeHash.toBuffer()],
    program.programId,
  );
  const connection = new Connection(rpc, "confirmed");
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

export const getSystemConfig = async (program:anchor.Program<FairMintToken>, network: keyof NetworkConfigs): Promise<ResponseData> => {
  try {
    const [systemConfigAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SYSTEM_CONFIG_SEEDS), new PublicKey(NETWORK_CONFIGS[network].systemDeployer).toBuffer()],
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
  const balanceRatioScaled = totalSupply.gt(new BN(0)) ? referrerAtaBalance.mul(SCALE).div(totalSupply) : new BN(0);
  const balanceRatio = balanceRatioScaled.toNumber() / SCALE.toNumber();

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
  // const discountRate = discountRateScaled.toNumber() / SCALE.toNumber();

  // Convert difficultyCoefficient to scaled BN
  const difficultyScaled = new BN(Math.floor(difficultyCoefficient * SCALE.toNumber()));

  // Calculate fee: feeRate * (1 + discountRate/difficultyCoefficient - discountRate)
  const one = SCALE;
  const discountByDifficulty = discountRateScaled.mul(SCALE).div(difficultyScaled);
  const scaledMultiplier = one.add(discountByDifficulty).sub(discountRateScaled);
  const fee = feeRate.mul(scaledMultiplier).div(SCALE);

  // console.log(
  //   "fee:",
  //   `${1} + ${discountRate} / ${difficultyCoefficient} - ${discountRate} = ${fee.toString()}`
  // );

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
export const metadataAccountPda = (network: keyof NetworkConfigs, mintAccount: PublicKey) => PublicKey.findProgramAddressSync(
  [
    Buffer.from(METADATA_SEED),
    NETWORK_CONFIGS[network].tokenMetadataProgramId.toBuffer(),
    mintAccount.toBuffer()
  ],
  NETWORK_CONFIGS[network].tokenMetadataProgramId,
)[0];

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
  network: keyof NetworkConfigs,
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

  const refundAccount = refundAccountPda(program, mintAccount, account.publicKey);

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
  const protocolWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, protocolFeeAccount, NETWORK_CONFIGS[network].allowOwnerOffCurveForProtocolFeeAccount, TOKEN_PROGRAM_ID);

  const wsolVaultAta = await getAssociatedTokenAddress(NATIVE_MINT, configAccount, true, TOKEN_PROGRAM_ID);

  let token0Mint = mintAccount;
  let token1Mint = NATIVE_MINT;
  let token0Program = TOKEN_PROGRAM_ID;
  let token1Program = TOKEN_PROGRAM_ID;
  if(compareMints(token0Mint, token1Mint) > 0) {
    [token0Mint, token1Mint] = [token1Mint, token0Mint];
    [token0Program, token1Program] = [token1Program, token0Program];
  }
  const _cpSwapProgram = NETWORK_CONFIGS[network].cpSwapProgram;
  const _cpSwapConfigAddress = NETWORK_CONFIGS[network].cpSwapConfigAddress;
  const _createPoolFeeReceive = NETWORK_CONFIGS[network].createPoolFeeReceive;

  const [authority] = getAuthAddress(_cpSwapProgram);
  const [poolAddress] = getPoolAddress(_cpSwapConfigAddress, token0Mint, token1Mint, _cpSwapProgram);
  const [lpMintAddress] = getPoolLpMintAddress(poolAddress, _cpSwapProgram);
  const [vault0] = getPoolVaultAddress(poolAddress, token0Mint, _cpSwapProgram);
  const [vault1] = getPoolVaultAddress(poolAddress, token1Mint, _cpSwapProgram);
  const [observationAddress] = getOrcleAccountAddress(poolAddress, _cpSwapProgram);

  const creatorLpTokenAddress = getAssociatedTokenAddressSync(lpMintAddress, account.publicKey, false, TOKEN_PROGRAM_ID);
  const creatorToken0 = getAssociatedTokenAddressSync(token0Mint, account.publicKey, false, token0Program);
  const creatorToken1 = getAssociatedTokenAddressSync(token1Mint, account.publicKey, false, token1Program);

  const context = {
    mint: mintAccount,
    destination: destinationAta,
    destinationWsolAta: destinationWsolAta,
    refundAccount: refundAccount,
    user: account.publicKey,
    configAccount,
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
    ammConfig: _cpSwapConfigAddress,
    cpSwapProgram: _cpSwapProgram,
    token0Mint: token0Mint,
    token1Mint: token1Mint,
  };

  // =============== Use RemainingAccounts for initializing pool accounts, total 21 accounts ===============
  const remainingAccounts: RemainingAccount[] = [{
    pubkey: _cpSwapProgram, // <- 1
    isWritable: false,
    isSigner: false,
  }, {
    pubkey: account.publicKey, // <- 2
    isWritable: true,
    isSigner: true,
  }, {
    pubkey: _cpSwapConfigAddress, // <- 3
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
    pubkey: _createPoolFeeReceive, // <- 14
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
        tokenUrl: `${NETWORK_CONFIGS[network].frontendUrl}/token/${mintAccount.toBase58()}`,
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

export const processTransaction = async (
  tx: Transaction,
  connection: Connection,
  wallet: AnchorWallet,
  successMessage: string,
  extraData: {}
) => {
  try {
    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Get processing tx
    const processingTx = localStorage.getItem('processing_tx');
    const processingTimestamp = localStorage.getItem('processing_timestamp');
    const now = Date.now();

    // Check if there is a processing transaction (transaction within 2 seconds is considered as processing)
    if (processingTx && processingTimestamp && (now - parseInt(processingTimestamp)) < 2000) {
      return {
        success: false,
        message: 'Previous transaction is still processing. Please wait.'
      }
    }

    // Set transaction parameters
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    // Sign and serialize
    const signedTx = await wallet.signTransaction(tx);
    const serializedTx = signedTx.serialize();

    // Simulate the transaction
    const simulation = await connection.simulateTransaction(signedTx);

    // If simulation fails, return error
    if (simulation.value.err) {
      return {
        success: false,
        message: `Transaction simulation failed: ${simulation.value.logs as string[]}`
      };
    }

    // Mark the transaction as processing
    localStorage.setItem('processing_tx', 'true');
    localStorage.setItem('processing_timestamp', now.toString());

    // Send the transaction
    const txHash = await connection.sendRawTransaction(serializedTx, {
      skipPreflight: true 
    });

    // Wait for the transaction confirmation
    const confirmation = await connection.confirmTransaction({
      signature: txHash,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      const txDetails = await connection.getTransaction(txHash, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const errorMessage = txDetails?.meta?.logMessages || [];
      return {
        success: false,
        message: 'Transaction failed: ' + errorMessage
      }
    }

    return {
      success: true,
      message: successMessage,
      data: {
        tx: txHash,
        ...extraData
      }
    };
  } catch (error: any) {
    if (error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
      return {
        success: false,
        message: 'Something went wrong but you have mint successfully',
      }
    }
    return {
      success: false,
      message: 'Error: ' + error.message,
    };
  } finally {
    localStorage.removeItem('processing_tx');
    localStorage.removeItem('processing_timestamp');
  }
}

export const parseConfigData = async (program: anchor.Program<FairMintToken> , configAccount: PublicKey): Promise<any> => {
  return new Promise((resolve, reject) => {
    program.account.tokenConfigData.fetch(configAccount).then((configData) => {
      try {
        resolve({
          admin: configData.admin,
          // feeVault: configData.feeVault.toBase58(),
          feeRate: configData.feeRate,
          // maxSupply: new anchor.BN(configData.maxSupply).div(new anchor.BN("1000000000")).toNumber(),
          // targetEras: configData.targetEras,
          // initialMintSize: configData.initialMintSize.toNumber() / 10**9,
          // epochesPerEra: configData.epochesPerEra.toNumber(),
          // targetSecondsPerEpoch: configData.targetSecondsPerEpoch.toNumber(),
          // reduceRatio: configData.reduceRatio,
          // tokenVault: configData.tokenVault.toBase58(),
          // supply: configData.mintStateData.supply.toNumber() / 10**9,
          // currentEra: configData.mintStateData.currentEra,
          // currentEpoch: configData.mintStateData.currentEpoch.toNumber(),
          // elapsedSecondsEpoch: configData.mintStateData.elapsedSecondsEpoch.toNumber(),
          // startTimestampEpoch: configData.mintStateData.startTimestampEpoch.toNumber(),
          // difficultyCoefficient: configData.mintStateData.difficultyCoefficientEpoch,
          // lastDifficultyCoefficient: configData.mintStateData.lastDifficultyCoefficientEpoch,
          mintSizeEpoch: configData.mintStateData.mintSizeEpoch,
          // quantityMintedEpoch: new anchor.BN(configData.mintStateData.quantityMintedEpoch).div(new anchor.BN("1000000000")).toNumber(),
          // targetMintSizeEpoch: new anchor.BN(configData.mintStateData.targetMintSizeEpoch).div(new anchor.BN("1000000000")).toNumber(),
          // graduateEpoch: configData.mintStateData.graduateEpoch,
        });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    })
  })
}

export const initializeToken = async (
  network: keyof NetworkConfigs,
  program: anchor.Program<FairMintToken>,
  account: AnchorWallet,
  connection: Connection,
  metadata: TokenMetadata,
  initConfigData: InitializeTokenConfig,
): Promise<ResponseData> => {
  try {
    // Basic balance check
    const balance = await getSolanaBalance(account.publicKey, connection);
    if (balance === 0) {
      return { success: false, message: 'Balance not enough' };
    }

    // Derive PDAs and ATAs
    const mint = mintAccount(program, metadata.name, metadata.symbol);
    const mintAccountInfo = await connection.getAccountInfo(mint);
    if (mintAccountInfo) {
      return {
        success: false,
        message: 'Token already exists',
      }
    }

    const cfgAccount = configAccount(program, mint);
    const metadataAccount = metadataAccountPda(network, mint);

    const systemCfgAccount = systemConfigAccount(program, new PublicKey((NETWORK_CONFIGS[network] as NetworkConfig).systemDeployer));
    const systemCfgData = await program.account.systemConfigData.fetch(systemCfgAccount);
    const protocolFeeAccount = systemCfgData.protocolFeeAccount as PublicKey;

    const mintTokenVaultAta = await getAssociatedTokenAddress(mint, mint, true, TOKEN_PROGRAM_ID);
    const tokenVaultAta = await getAssociatedTokenAddress(mint, cfgAccount, true, TOKEN_PROGRAM_ID);
    const wsolVaultAta = await getAssociatedTokenAddress(NATIVE_MINT, cfgAccount, true, TOKEN_PROGRAM_ID);

    // Build instructions
    const ix0 = ComputeBudgetProgram.setComputeUnitLimit({ units: 500000 });

    const startTimestamp = Math.floor(Date.now() / 1000)
    initConfigData = {
      ...initConfigData,
      startTimestamp: new BN(startTimestamp),
    }

    const contextInitializeTokenAccounts = {
      metadata: metadataAccount,
      payer: account.publicKey,
      mint,
      configAccount: cfgAccount,
      mintTokenVault: mintTokenVaultAta,
      tokenVault: tokenVaultAta,
      wsolMint: NATIVE_MINT,
      wsolVault: wsolVaultAta,
      systemConfigAccount: systemCfgAccount,
      protocolFeeAccount: protocolFeeAccount,
      launchRuleAccount: NETWORK_CONFIGS[network].launchRuleAccount,
      tokenMetadataProgram: NETWORK_CONFIGS[network].tokenMetadataProgramId,
    }

    const ix = await program.methods
      .initializeToken(metadata, initConfigData as any)
      .accounts(contextInitializeTokenAccounts)
      .instruction();

    const tx = new Transaction().add(ix0).add(ix);

    const result = await processTransaction(
      tx,
      connection,
      account,
      'Token launched successfully',
      {
        mintAddress: mint.toBase58(),
        configAccount: cfgAccount.toBase58(),
        metadataAccount: metadataAccount.toBase58(),
        tokenUrl: `${NETWORK_CONFIGS[network].frontendUrl}/token/${mint.toBase58()}`,
      }
    );

    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
