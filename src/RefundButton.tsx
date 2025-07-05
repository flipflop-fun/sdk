import React, { FC, useEffect } from 'react';
import { RefundButtonProps, SuccessResponseData } from './types/common';
import * as anchor from '@coral-xyz/anchor';
import { FairMintToken } from './types/fair_mint_token';
import idl from "./idl/fair_mint_token.json";
import { defaultInformationStyle, defaultRefundButtonStyle } from './types/styles';
import { NETWORK_CONFIGS } from './config';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { configAccount, mintAccount, processTransaction, refundAccountPda, systemConfigAccount } from './utils/web3';

const RefundButton: FC<RefundButtonProps> = ({
  network,
  mintAddress,
  buttonStyle,
  informationStyle,
  buttonTitle,
  wallet,
  connection,
  tokenInfo,
  onStart,
  onError,
  onSuccess,
}) => {
  const [burnTokens, setBurnTokens] = React.useState("0");

  useEffect(() => {
    getTokenInfo();
  }, [mintAddress]);

  const getTokenInfo = async () => {
    if (!mintAddress || !wallet?.publicKey) {
      return;
    }
    
    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(mintAddress),
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      
      // console.log('User Token Account:', userTokenAccount.toBase58());
      const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
      if (tokenAccountInfo) {
        const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
        setBurnTokens(tokenBalance.value.uiAmountString || "0");
      } else {
        onError?.('Token account does not exist')
        setBurnTokens("0");
      }
    } catch (error) {
      onError?.('Error getting token account');
    }
  }
  
  const refund = async () => {
    onStart?.();
    if (!wallet) {
      onError?.('Wallet is not connected');
      return;
    }
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    if (!mintAddress || mintAddress === '') {
      onError?.('Mint address is not provided');
      return;
    }

    const program = new anchor.Program<FairMintToken>(idl, provider);

    if (!provider.wallet) {
      onError?.('Wallet is not connected');
      return;
    }
    const _mintAccount = mintAccount(program, tokenInfo.tokenName, tokenInfo.tokenSymbol);
    if (_mintAccount.toBase58() !== mintAddress) {
      onError?.('Mint address is not correct');
      return;
    }

    const _systemConfigAccount = systemConfigAccount(program, new PublicKey(NETWORK_CONFIGS[network].systemDeployer));
    const _protocolFeeAccount = new PublicKey(NETWORK_CONFIGS[network].protocolFeeAccount);
    const _mintAddress = new PublicKey(mintAddress);
    const _configAccount = configAccount(program, _mintAddress);
    const _refundAccount = refundAccountPda(program, _mintAddress, wallet.publicKey);
    const refundAccountData = await program.account.tokenRefundData.fetch(_refundAccount);
    if (refundAccountData.owner.toBase58() !== wallet.publicKey.toBase58()) {
      return {
        success: false,
        message: 'Only User Account Allowed'
      }
    }
    const tokenAta = await getAssociatedTokenAddress(new PublicKey(mintAddress), wallet.publicKey, false, TOKEN_PROGRAM_ID);
    const payerWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, wallet.publicKey, false, TOKEN_PROGRAM_ID);
    const protocolWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, _protocolFeeAccount, false, TOKEN_PROGRAM_ID);
    const wsolVaultAta = await getAssociatedTokenAddress(NATIVE_MINT, new PublicKey(_configAccount), true, TOKEN_PROGRAM_ID);
    const tokenVaultAta = await getAssociatedTokenAddress(new PublicKey(mintAddress), _configAccount, true, TOKEN_PROGRAM_ID);

    const refundAccounts = {
      mint: new PublicKey(mintAddress),
      refundAccount: _refundAccount,
      configAccount: _configAccount,
      tokenAta,
      tokenVault: new PublicKey(tokenVaultAta),
      protocolFeeAccount: _protocolFeeAccount,
      systemConfigAccount: _systemConfigAccount,
      payer: wallet.publicKey,
      wsolVault: wsolVaultAta,
      payerWsolVault: payerWsolAta,
      protocolWsolVault: protocolWsolAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const instructionRefund = await program.methods
      .refund(tokenInfo.tokenName, tokenInfo.tokenSymbol)
      .accounts(refundAccounts)
      .instruction();

    try {
      const tx = new Transaction();

      const payerWsolAtaData = await connection.getAccountInfo(payerWsolAta);
      // If payer has not received WSOL before and has no WSOL ata, create it
      if (!payerWsolAtaData) tx.add(createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        payerWsolAta,
        wallet.publicKey,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID
      ));
      // If protocol account has not received WSOL before and has no WSOL ata, create it
      const protocolWsolAtaData = await connection.getAccountInfo(protocolWsolAta);
      if (!protocolWsolAtaData) tx.add(createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        protocolWsolAta,
        _protocolFeeAccount,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID
      ));
      // Add refund instruction
      tx.add(instructionRefund);
      // send transactions
      const result = await processTransaction(tx, connection, wallet, "Refund successfully", { mint: mintAddress });
      if (result && result.success) {
        onSuccess?.({
          publicKey: wallet.publicKey.toBase58(),
          tokenAccount: tokenAta.toBase58(),
          wsolAccount: payerWsolAta.toBase58(),
          tx: result.data?.tx,
          tokenUrl: `${NETWORK_CONFIGS[network].frontendUrl}/token/${mintAddress}`,
        } as SuccessResponseData)
      } else {
        onError?.(result.message);
      }
      return;
    } catch (error: any) {
      if (error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
        onError?.('Something went wrong but you have refund successfully')
        return;
      }
      onError?.('Error refunding' + error);
      return;
    }
  }

  return (
    <div>
        <div style={{...defaultInformationStyle, ...informationStyle}}>
          <div style={{marginRight: '2px'}}>Burn {burnTokens} {tokenInfo.tokenSymbol}</div>
          <a href={`${NETWORK_CONFIGS[network].frontendUrl}/token/${mintAddress}`} target='_blank'>[{tokenInfo.tokenName}]</a>
        </div>
        <div style={{...defaultRefundButtonStyle, ...buttonStyle}} onClick={() => refund()}>
          <div>{buttonTitle ? buttonTitle : "Refund"}</div>
        </div>
    </div>
  );
};

export default RefundButton;