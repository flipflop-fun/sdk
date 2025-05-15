import React, { FC } from 'react';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { FairMintToken } from './types/fair_mint_token';
import idl from "./idl/fair_mint_token.json";
import { cleanMetadata, configAccount, getLegacyTokenMetadata, getReferralDataByCodeHash, getReferrerCodeHash, metadataAccountPda, mintBy, referralAccount, systemConfigAccount } from './utils/web3';
import { addressLookupTableAddress, SYSTEM_DEPLOYER } from './config';
import { SuccessResponseData } from './types/common';

type MintButtonProps = {
  mintAddress: string;
  urcCode: string;
  wallet: AnchorWallet;
  connection: Connection;
  buttonTitle?: string;
  buttonStyle?: Object;
  onStart?: () => void;
  onError?: (error: string) => void;
  onSuccess?: (data: SuccessResponseData) => void;
};

const defaultButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
};

const MintButton: FC<MintButtonProps> = ({
  mintAddress,
  urcCode,
  buttonStyle,
  buttonTitle,
  wallet,
  connection,
  onStart,
  onError,
  onSuccess,
}) => {

  const mint = async () => {
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
    if (!urcCode || urcCode === '') {
      onError?.('Urc code is not provided');
      return;
    }
    const program = new anchor.Program<FairMintToken>(idl, provider);

    console.log('start mint');
    if (!provider.wallet) {
      onError?.('Wallet is not connected');
      return;
    }

    const _systemConfigAccount = systemConfigAccount(program, new PublicKey(SYSTEM_DEPLOYER));
    console.log('_systemConfigAccount', _systemConfigAccount.toBase58());
    const _protocolFeeAccount = new PublicKey(SYSTEM_DEPLOYER);
    console.log('_protocolFeeAccount', _protocolFeeAccount.toBase58());
    const _mintAddress = new PublicKey(mintAddress);
    console.log('_mintAddress', _mintAddress.toBase58());
    const _configAccount = configAccount(program, _mintAddress);
    console.log('_configAccount', _configAccount.toBase58());
    const _codeHash = getReferrerCodeHash(program, urcCode);
    const _referralData = await getReferralDataByCodeHash(program, _codeHash);
    if (!_referralData.success) {
      onError?.('Referral data not found');
      return;
    }
    const _referrerMain = _referralData.data.referrerMain;
    if (_referrerMain.toBase58() === provider.wallet.publicKey.toBase58()) {
      onError?.('Referrer can not be same as wallet');
      return;
    }
    const _referralAccount = referralAccount(program, _mintAddress, _referrerMain);
    console.log("_referralAccount", _referralAccount.toBase58());
    const lookupTableAddress = new PublicKey(addressLookupTableAddress); // devnet
    console.log("lookupTableAddress", lookupTableAddress);

    const _metadataAccount = metadataAccountPda(new PublicKey(mintAddress));
    console.log("_metadataAccount", _metadataAccount)
    const metadataAccountInfo = await connection.getAccountInfo(_metadataAccount);
    const rawMetadata = await getLegacyTokenMetadata(metadataAccountInfo);
    if (!rawMetadata.success) {
      onError?.('Failed to get metadata');
      return;
    }
    const _metadata = cleanMetadata({
      symbol: rawMetadata.data.data.symbol,
      name: rawMetadata.data.data.name,
      uri: rawMetadata.data.data.uri,
    });
    console.log("_metadata", _metadata);

    const response = await mintBy(
      (program as unknown) as anchor.Program<FairMintToken>,
      _mintAddress,
      _configAccount,
      _referralAccount,
      _referrerMain,
      _metadata,
      _codeHash,
      wallet,
      _systemConfigAccount,
      connection,
      lookupTableAddress,
      _protocolFeeAccount
    );
    console.log("response", response);
    if (!response.success) {
      onError?.(response.data.message);
      return;
    } else {
      onSuccess?.(response.data as SuccessResponseData);
      return;
    }
  }

  return (
    <div style={{...defaultButtonStyle, ...buttonStyle}} onClick={() => mint()}>
      <div>{buttonTitle ? buttonTitle : "Mint"}</div>
    </div>
  );
};

export default MintButton;