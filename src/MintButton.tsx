import React, { FC, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { FairMintToken } from './types/fair_mint_token';
import idl from "./idl/fair_mint_token.json";
import { cleanMetadata, configAccount, getLegacyTokenMetadata, getReferralDataByCodeHash, getReferrerCodeHash, metadataAccountPda, mintBy, referralAccount, systemConfigAccount } from './utils/web3';
import { addressLookupTableAddress, FLIPFLOP_BASE_URL, MAX_URC_USAGE_COUNT, SYSTEM_DEPLOYER } from './config';
import { InitiazlizedTokenData, MintButtonProps, SuccessResponseData } from './types/common';
import FlipflopLogo from './FlipflopLogo';
import { queryInitializeTokenEventBySearch } from './graphql';
import { ApolloProvider, useQuery } from '@apollo/client';
import { client, RefundButton } from '.';
import { defaultFlipflopLogoStyle, defaultGenerateURCStyle, defaultInformationStyle, defaultMintButtonStyle, defaultRefundButtonStyle } from './types/styles';

const MintButtonInner: FC<MintButtonProps> = ({
  mintAddress,
  urcCode,
  showRefundButton,
  mintButtonStyle,
  refundButtonStyle,
  refundButtonTitle,
  informationStyle,
  generateURCStyle,
  flipflopLogoStyle,
  buttonTitle,
  wallet,
  connection,
  onStart,
  onError,
  onSuccess,
  onRefundError,
  onRefundSuccess,
  onRefundStart,
}) => {
  const [donateAmount, setDonateAmount] = React.useState(0);
  const [mintAmount, setMintAmount] = React.useState("0");
  const [tokenSymbol, setTokenSymbol] = React.useState('');
  const [tokenName, setTokenName] = React.useState('');

  const { loading, error, data } = useQuery(queryInitializeTokenEventBySearch, {
    variables: {
      skip: 0,
      first: 1,
      searchQuery: mintAddress
    },
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    const getTokenInfo = async () => {
      const tokenData = (data?.initializeTokenEventEntities as InitiazlizedTokenData[])[0];
      if(!tokenData || tokenData.mint !== mintAddress) {
        onError?.('Mint address is not matched');
        return;
      }
      setDonateAmount(parseFloat(tokenData.feeRate) / LAMPORTS_PER_SOL);
      setMintAmount((parseInt(tokenData.mintSizeEpoch) / LAMPORTS_PER_SOL).toLocaleString(undefined, {maximumFractionDigits: 2})); // ######
      setTokenSymbol(tokenData.tokenSymbol);
      setTokenName(tokenData.tokenName);
    }
    if(!loading && !error && data) getTokenInfo();
  }, [data, loading, error]);

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
      onError?.('URC code is not provided');
      return;
    }
    const program = new anchor.Program<FairMintToken>(idl, provider);

    if (!provider.wallet) {
      onError?.('Wallet is not connected');
      return;
    }

    const _systemConfigAccount = systemConfigAccount(program, new PublicKey(SYSTEM_DEPLOYER));
    const _protocolFeeAccount = new PublicKey(SYSTEM_DEPLOYER);
    const _mintAddress = new PublicKey(mintAddress);
    const _configAccount = configAccount(program, _mintAddress);
    const _codeHash = getReferrerCodeHash(program, urcCode);
    const _referralData = await getReferralDataByCodeHash(program, _codeHash);
    if (!_referralData.success) {
      onError?.('Fail to get URC data, please use another one.');
      return;
    }

    if (_referralData.data.usageCount >= MAX_URC_USAGE_COUNT) {
      onError?.('URC code is used up, please use another one.');
      return;
    }
    const _referrerMain = _referralData.data.referrerMain;
    if (_referrerMain.toBase58() === provider.wallet.publicKey.toBase58()) {
      onError?.('Referrer can not be same as wallet');
      return;
    }
    const _referralAccount = referralAccount(program, _mintAddress, _referrerMain);
    const lookupTableAddress = new PublicKey(addressLookupTableAddress); // devnet
    const _metadataAccount = metadataAccountPda(new PublicKey(mintAddress));
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
    if (!response.success) {
      onError?.(response.data.message);
      return;
    } else {
      onSuccess?.(response.data as SuccessResponseData);
      return;
    }
  }

  return (
    <div>
    {donateAmount > 0 &&
      <div>
        <div style={{...defaultInformationStyle, ...informationStyle}}>
          <div style={{marginRight: '2px'}}>Donate {donateAmount} SOL and get ~{mintAmount} {tokenSymbol}</div>
          <a href={`${FLIPFLOP_BASE_URL}/token/${mintAddress}`} target='_blank'>[{tokenName}]</a>
        </div>
        <div style={{...defaultMintButtonStyle, ...mintButtonStyle}} onClick={() => mint()}>
          <div>{buttonTitle ? buttonTitle : "Mint"}</div>
        </div>
        {showRefundButton &&
          <RefundButton
            tokenInfo={{tokenName, tokenSymbol}}
            mintAddress={mintAddress}
            wallet={wallet}
            connection={connection}
            buttonStyle={refundButtonStyle}
            buttonTitle={refundButtonTitle}
            informationStyle={informationStyle}
            onStart={onRefundStart}
            onError={onRefundError}
            onSuccess={onRefundSuccess}
          />}
        <a style={{...defaultGenerateURCStyle, ...generateURCStyle}} href={`${FLIPFLOP_BASE_URL}/token/${mintAddress}`} target="_blank">
          Activiate my URC code
        </a>
        <div style={{...defaultFlipflopLogoStyle, ...flipflopLogoStyle}}>
          <FlipflopLogo />
        </div>
      </div>}
    </div>
  );
};

const MintButton: FC<MintButtonProps> = ({
  mintAddress,
  urcCode,
  showRefundButton,
  mintButtonStyle,
  refundButtonStyle,
  refundButtonTitle,
  informationStyle,
  generateURCStyle,
  flipflopLogoStyle,
  buttonTitle,
  wallet,
  connection,
  onStart,
  onError,
  onSuccess,
  onRefundStart,
  onRefundError,
  onRefundSuccess,
}) => {
  return (
    <ApolloProvider client={client}>
      <MintButtonInner
        mintAddress={mintAddress}
        urcCode={urcCode}
        mintButtonStyle={mintButtonStyle}
        refundButtonStyle={refundButtonStyle}
        refundButtonTitle={refundButtonTitle}
        showRefundButton={showRefundButton}
        informationStyle={informationStyle}
        generateURCStyle={generateURCStyle}
        flipflopLogoStyle={flipflopLogoStyle}
        buttonTitle={buttonTitle}
        wallet={wallet}
        connection={connection}
        onStart={onStart}
        onError={onError}
        onSuccess={onSuccess}
        onRefundStart={onRefundStart}
        onRefundError={onRefundError}
        onRefundSuccess={onRefundSuccess}
      />
    </ApolloProvider>
  )
}
export default MintButton;