import React, { JSX, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { FairMintToken } from './types/fair_mint_token';
import idl_devnet from "./idl/fair_mint_token_devnet.json";
import idl_mainnet from "./idl/fair_mint_token_mainnet.json";
import { cleanMetadata, configAccount, getLegacyTokenMetadata, getReferralDataByCodeHash, getReferrerCodeHash, metadataAccountPda, mintBy, parseConfigData, referralAccount, systemConfigAccount } from './utils/web3';
import { MAX_URC_USAGE_COUNT, NETWORK_CONFIGS } from './config';
import { ConfigData, MintButtonProps, SuccessResponseData } from './types/common';
import FlipflopLogo from './FlipflopLogo';
import { RefundButton } from '.';
import { defaultFlipflopLogoStyle, defaultGenerateURCStyle, defaultInformationStyle, defaultMintButtonStyle } from './types/styles';

const MintButton = ({
  network,
  rpc,
  mintAddress,
  urcCode,
  showRefundButton,
  showUrcButton,
  mintButtonStyle,
  refundButtonStyle,
  refundButtonTitle,
  informationStyle,
  generateURCStyle,
  flipflopLogoStyle,
  mintButtonTitle,
  wallet,
  connection,
  onMintStart,
  onMintError,
  onMintSuccess,
  onRefundError,
  onRefundSuccess,
  onRefundStart,
}: MintButtonProps): JSX.Element => {
  const [donateAmount, setDonateAmount] = React.useState(0);
  const [mintAmount, setMintAmount] = React.useState("0");
  const [tokenData, setTokenData] = React.useState<ConfigData>({} as ConfigData);
  const [metadata, setMetadata] = React.useState({name: '', symbol: '', uri: ''})
  const [tokenSymbol, setTokenSymbol] = React.useState('');
  const [tokenName, setTokenName] = React.useState('');

  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = network === "devnet" ? new anchor.Program<FairMintToken>(idl_devnet, provider) : new anchor.Program<FairMintToken>(idl_mainnet, provider);

  useEffect(() => {
    const getTokenInfo = async () => {
      // Cancel get tokenData from graphql, use configAccount
      if (!mintAddress || mintAddress === '') {
        onMintError?.('Mint address is not provided');
        return;
      }
      // const programId = NETWORK_CONFIGS[network].programId;
      const _configAccount = configAccount(program, new PublicKey(mintAddress));
      const _metadata = await getMetadata();
      if (_metadata) {
        setMetadata(_metadata);
        const _tokenData = await parseConfigData(program, _configAccount);
        setTokenData(_tokenData);
        setDonateAmount(parseFloat(_tokenData.feeRate) / LAMPORTS_PER_SOL);
        setMintAmount((parseInt(_tokenData.mintSizeEpoch) / LAMPORTS_PER_SOL).toLocaleString(undefined, {maximumFractionDigits: 2}));
        setTokenSymbol(_metadata.symbol);
        setTokenName(_metadata.name);
      } else {
        onMintError?.('Metadata is not found');
      }
    }
    getTokenInfo();
  }, []);

  const getMetadata = async () => {
    const _metadataAccount = metadataAccountPda(network, new PublicKey(mintAddress));
    const metadataAccountInfo = await connection.getAccountInfo(_metadataAccount);
    const rawMetadata = await getLegacyTokenMetadata(metadataAccountInfo);
    if (!rawMetadata.success) {
      return null;
    }
    return cleanMetadata({
      symbol: rawMetadata.data.data.symbol,
      name: rawMetadata.data.data.name,
      uri: rawMetadata.data.data.uri,
    });
  }
  const mint = async () => {
    onMintStart?.();
    if (!wallet) {
      onMintError?.('Wallet is not connected');
      return;
    }
    if (!mintAddress || mintAddress === '') {
      onMintError?.('Mint address is not provided');
      return;
    }
    if (!urcCode || urcCode === '') {
      onMintError?.('URC code is not provided');
      return;
    }

    if (!provider.wallet) {
      onMintError?.('Wallet is not connected');
      return;
    }
    const _systemConfigAccount = systemConfigAccount(program, new PublicKey(NETWORK_CONFIGS[network].systemDeployer));
    const _protocolFeeAccount = new PublicKey(NETWORK_CONFIGS[network].protocolFeeAccount);
    const _mintAddress = new PublicKey(mintAddress);
    const _configAccount = configAccount(program, _mintAddress);
    const _codeHash = getReferrerCodeHash(program, urcCode);
    const _referralData = await getReferralDataByCodeHash(rpc, program, _codeHash);
    if (!_referralData.success) {
      onMintError?.('Fail to get URC data, please use another one.');
      return;
    }
    const _referrerMain = _referralData.data.referrerMain;
    if (tokenData.admin.toBase58() !== _referrerMain.toBase58() && _referralData.data.usageCount >= MAX_URC_USAGE_COUNT) {
      onMintError?.('URC code is used up, please use another one.');
      return;
    }
    if (_referrerMain.toBase58() === provider.wallet.publicKey.toBase58()) {
      onMintError?.('Referrer can not be same as wallet');
      return;
    }
    const _referralAccount = referralAccount(program, _mintAddress, _referrerMain);
    const lookupTableAddress = new PublicKey(NETWORK_CONFIGS[network].addressLookupTableAddress);

    const response = await mintBy(
      network,
      (program as unknown) as anchor.Program<FairMintToken>,
      _mintAddress,
      _configAccount,
      _referralAccount,
      _referrerMain,
      metadata,
      _codeHash,
      wallet,
      _systemConfigAccount,
      connection,
      lookupTableAddress,
      _protocolFeeAccount
    );
    if (!response.success) {
      onMintError?.(response.data.message);
      return;
    } else {
      onMintSuccess?.(response.data as SuccessResponseData);
      return;
    }
  }

  return (
    <div>
    {donateAmount > 0 &&
      <div>
        <div style={{...defaultInformationStyle, ...informationStyle}}>
          <div style={{marginRight: '2px'}}>Donate {donateAmount} SOL and get ~{mintAmount} {tokenSymbol}</div>
          <a href={`${NETWORK_CONFIGS[network].frontendUrl}/token/${mintAddress}`} target='_blank'>[{tokenName}]</a>
        </div>
        <div style={{...defaultMintButtonStyle, ...mintButtonStyle}} onClick={() => mint()}>
          <div>{mintButtonTitle ? mintButtonTitle : "Mint"}</div>
        </div>
        {showRefundButton &&
          <RefundButton
            network={network}
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
        {showUrcButton &&
          <a style={{...defaultGenerateURCStyle, ...generateURCStyle}} href={`${NETWORK_CONFIGS[network].frontendUrl}/token/${mintAddress}`} target="_blank">
            Activiate my URC code
          </a>
        }
        <div style={{...defaultFlipflopLogoStyle, ...flipflopLogoStyle}}>
          <FlipflopLogo />
        </div>
      </div>}
    </div>
  );
};

export default MintButton;