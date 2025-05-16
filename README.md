## Overview

The `Flipflop MintButton` component is a React component for minting `Proof Of Mint` tokens on any website. It provides a customizable button interface with token information display and minting functionality.

![](./images/image1.jpg)

## Installation
```bash
npm install @flipflop-sdk/tools
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mintAddress | string | Yes | The address of the token to mint |
| urcCode | string | Yes | The URC code for referral |
| wallet | AnchorWallet | Yes | Solana wallet instance |
| connection | Connection | Yes | Solana connection instance |
| buttonTitle | string | No | Custom button text (default: "Mint") |
| buttonStyle | Object | No | Custom styles for the mint button |
| informationStyle | Object | No | Custom styles for the token information display |
| generateURCStyle | Object | No | Custom styles for the URC code generation link |
| flipflopLogoStyle | Object | No | Custom styles for the FlipFlop logo |
| onStart | () => void | No | Callback function called when minting starts |
| onError | (error: string) => void | No | Callback function called when an error occurs |
| onSuccess | (data: SuccessResponseData) => void | No | Callback function called after successful minting |

## Default Styles
```typescript
const defaultButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
};

const defaultInformationStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '12px',
};

const defaultGenerateURCStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '14px',
};

const defaultFlipflopLogoStyle = {
  display: 'flex',
  justifyContent: 'center',
};
```

## Usage Example
```typescript
import { MintButton } from '@flipflop-sdk/tools';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const App = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const handleMintStart = () => {
    console.log('Minting started');
  };

  const handleMintError = (error: string) => {
    console.error('Minting error:', error);
  };

  const handleMintSuccess = (data: SuccessResponseData) => {
    console.log('Minting successful:', data);
  };

  return (
    <MintButton
      mintAddress="your_token_mint_address"
      urcCode="your_urc_code"
      wallet={wallet}
      connection={connection}
      buttonTitle="Mint Token"
      buttonStyle={{
        padding: '15px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
      }}
      onStart={handleMintStart}
      onError={handleMintError}
      onSuccess={handleMintSuccess}
    />
  );
};
```

## Features
- Automatic token information fetching and display
- Customizable button and information styles
- Built-in error handling
- URC code integration
- Solana wallet integration
- GraphQL integration for token data
- FlipFlop branding with customizable styling

## Notes
1. The component requires a Solana wallet connection to function
2. URC code must be valid and not exceeded usage limit
3. Token information is automatically fetched using GraphQL
4. The component includes built-in Apollo Client configuration
5. All styling is customizable through props