import React, { JSX } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { FairMintToken } from './types/fair_mint_token';
import idl_devnet from "./idl/fair_mint_token_devnet.json";
import idl_mainnet from "./idl/fair_mint_token_mainnet.json";
import { defaultMintButtonStyle } from './types/styles';
import { LaunchTokenButtonProps, InitializeSuccessData } from './types/common';
import { cleanMetadata, initializeToken, uploadToStorage } from './utils/web3';
import { DEFAULT_PARAMS, MAX_AVATAR_SIZE } from './config';

const LaunchTokenButton = ({
  network,
  wallet,
  connection,
  name,
  symbol,
  file,
  tokenType,
  buttonTitle,
  buttonStyle,
  onStart,
  onError,
  onSuccess,
}: LaunchTokenButtonProps): JSX.Element => {
  const provider = new anchor.AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' });
  const program = network === 'devnet'
    ? new anchor.Program<FairMintToken>(idl_devnet as FairMintToken, provider)
    : new anchor.Program<FairMintToken>(idl_mainnet as FairMintToken, provider);
  
  const onLaunch = async () => {
    try {
      onStart?.();
      if (!wallet) {
        onError?.('Wallet is not connected');
        return;
      }

      // Check if the with equals height if the file is image, and the size of image should be smaller than 250k
      if (file && file.type.startsWith('image/')) {
        const img = new Image();
        img.onerror = () => {
          onError?.('Image load failed');
          return;
        };
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width !== img.height) {
            onError?.('Image must be square');
            return;
          }
          if (file.size > MAX_AVATAR_SIZE) {
            onError?.('Image size must be smaller than 250k');
            return;
          }
        };
      }

      // 1) Optional: upload avatar image
      let imageUrl: string | undefined;
      if (file) {
        const imgResp = await uploadToStorage(network, file, 'avatar');
        if (!imgResp.success) {
          onError?.(imgResp.message || 'Image upload failed');
          return;
        }
        // 兼容后端返回字段形式：优先 data.imageUrl 或 data.url
        imageUrl = imgResp?.data;
      }

      // 2) Optional: build and upload metadata json
      let finalUri = '';
      if (file || imageUrl) {
        const metaToUpload = {
          name,
          symbol,
          description: '',
          image: imageUrl,
          extensions: {
            website: '',
            twitter: '',
            discord: '',
            telegram: '',
            github: '',
            medium: '',
          },
        };
        const metadataBlob = new Blob([JSON.stringify(metaToUpload)], {
          type: 'application/json'
        });
        const metadataFile = new File([metadataBlob], 'metadata.json', {
          type: 'application/json'
        });

        const mdResp = await uploadToStorage(network, metadataFile, 'metadata');
        if (!mdResp.success) {
          onError?.(mdResp.message || 'Metadata upload failed');
          return;
        }
        finalUri = mdResp?.data;
      }

      console.log('metadata uri', finalUri);
      const md = cleanMetadata({
        name,
        symbol,
        uri: finalUri,
      });

      const initConfigData = DEFAULT_PARAMS[tokenType];
      if (!initConfigData) {
        onError?.('Token type not supported');
        return;
      }

      const resp = await initializeToken(
        network,
        program as unknown as anchor.Program<FairMintToken>,
        wallet,
        connection,
        md,
        initConfigData
      );

      if (!resp.success) {
        onError?.(resp.message || 'Initialize failed');
        return;
      }

      onSuccess?.(resp.data as InitializeSuccessData);
    } catch (e: any) {
      onError?.("Initialize failed: " + e.message || 'Unknown error');
    }
  };

  return (
    <div>
      <div style={{ ...defaultMintButtonStyle, ...buttonStyle }} onClick={onLaunch}>
        <div>{buttonTitle ? buttonTitle : 'Launch'}</div>
      </div>
    </div>
  );
};

export default LaunchTokenButton;