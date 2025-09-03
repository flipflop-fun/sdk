# FlipFlop SDK Tools

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/flipflop-fun/sdk)
[![npm version](https://badge.fury.io/js/%40flipflop-sdk%2Ftools.svg)](https://badge.fury.io/js/%40flipflop-sdk%2Ftools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/flipflop-fun/sdk)

A comprehensive React SDK for integrating FlipFlop's Proof of Mint functionality into your Apps. This toolkit provides production-ready components for seamless token minting experiences with built-in wallet integration, error handling, and customizable UI components.

![FlipFlop MintButton Demo](./images/image1.jpg)

## 🚀 Quick Start

### Installation

```bash
npm install @flipflop-sdk/tools
# or
yarn add @flipflop-sdk/tools
# or
pnpm add @flipflop-sdk/tools
```

### Basic Usage
```
import { MintButton } from '@flipflop-sdk/tools';
import { useConnection, useWallet } from '@solana/
wallet-adapter-react';

function App() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return (
    <MintButton
      network="devnet" // or "mainnet"
      mintAddress="your_token_mint_address"
      urcCode="your_urc_code"
      wallet={wallet}
      connection={connection}
      showRefundButton={true}
      showUrcButton={true}
      mintButtonTitle="Mint"
      mintButtonStyle={{
        backgroundColor: 'green',
      }}
      refundButtonTitle="Refund"
      refundButtonStyle={{
        backgroundColor: 'red',
      }}
      onMintStart={() => {
        console.log('Mint started');
      }}
      onMintError={(error) => {
        console.error('Mint error:', error);
      }}
      onMintSuccess={(data) => {
        console.log('Mint success:', data);
      }}
      onRefundStart={() => {
        console.log('Refund started');
      }}
      onRefundError={(error) => {
        console.error('Refund error:', error);
      }}
      onRefundSuccess={(data) => {
        console.log('Refund success:', data);
      }}
    />
  );
}
```

## 📚 API Reference
### MintButton Component
The primary component for integrating Proof of Mint functionality.

### LaunchTokenButton Component
A comprehensive component for launching new tokens with integrated file upload and metadata management.

#### Props
| Property           | Type                 | Required | Default     | Description                     |
|--------------------|----------------------|----------|-------------|---------------------------------|
| network            | "devnet" \| "mainnet" | ✅       | -           | The Solana network              |
| mintAddress        | string               | ✅        | -           | The Solana token mint address   |
| urcCode            | string               | ✅        | -           | Unique referral code for tracking |
| wallet             | AnchorWallet         | ✅        | -           | Connected Solana wallet instance |
| connection         | Connection           | ✅        | -           | Solana RPC connection           |
| showRefundButton   | boolean              | ✅        | -           | Show refund button              |
| showUrcButton      | boolean              | ✅        | -           | Show URC button                 |
| mintButtonTitle    | string               | ❌        | "Mint"      | Custom mint button text         |
| mintButtonStyle    | CSSProperties        | ❌        | See defaults | Custom mint button styling     |
| refundButtonTitle  | string               | ❌        | "Refund"    | Custom refund button text       |
| refundButtonStyle  | CSSProperties        | ❌        | See defaults | Custom refund button styling   |
| informationStyle   | CSSProperties        | ❌        | See defaults | Token info display styling      |
| generateURCStyle   | CSSProperties        | ❌        | See defaults | URC generation link styling     |
| flipflopLogoStyle  | CSSProperties        | ❌        | See defaults | FlipFlop logo styling           |
| onMintStart        | () => void           | ❌        | -           | Callback fired when minting begins |
| onMintError        | (error: string) => void | ❌     | -           | Error handling callback for minting  |
| onMintSuccess      | (data: SuccessResponseData) => void | ❌ | -       | Success callback with transaction data |
| onRefundStart        | () => void           | ❌        | -           | Callback fired when refunding begins |
| onRefundError        | (error: string) => void | ❌     | -           | Error handling callback for refunding     |
| onRefundSuccess      | (data: SuccessResponseData) => void | ❌ | -       | Success callback with transaction data |

#### LaunchTokenButton Props
| Property           | Type                 | Required | Default     | Description                     |
|--------------------|----------------------|----------|-------------|---------------------------------|
| network            | "devnet" \| "mainnet" | ✅       | -           | The Solana network              |
| wallet             | AnchorWallet         | ✅        | -           | Connected Solana wallet instance |
| connection         | Connection           | ✅        | -           | Solana RPC connection           |
| metadata           | TokenMetadataIPFS    | ✅        | -           | Token metadata (name, symbol, description, etc.) |
| imageFileForUpload | File \| Blob         | ❌        | -           | Image file to upload (will override metadata.image) |
| metadataForUpload  | TokenMetadataIPFS    | ❌        | -           | Metadata to upload (will override metadata.uri) |
| buttonTitle        | string               | ❌        | "Launch Token" | Custom button text         |
| buttonStyle        | CSSProperties        | ❌        | See defaults | Custom button styling     |
| onLaunchStart      | () => void           | ❌        | -           | Callback fired when launch begins |
| onLaunchError      | (error: string) => void | ❌     | -           | Error handling callback  |
| onLaunchSuccess    | (data: LaunchSuccessData) => void | ❌ | -       | Success callback with token data |

#### LaunchTokenButton Usage
```typescript
import { LaunchTokenButton } from '@flipflop-sdk/tools';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function TokenLauncher() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const tokenMetadata = {
    name: "My Token",
    symbol: "MTK",
    description: "A sample token",
    image: "https://example.com/placeholder.jpg", // Will be overridden if imageFileForUpload is provided
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      
      <LaunchTokenButton
        network="devnet"
        wallet={wallet}
        connection={connection}
        metadata={tokenMetadata}
        imageFileForUpload={imageFile}
        buttonTitle="Launch My Token"
        buttonStyle={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
        onLaunchStart={() => {
          console.log('Token launch started');
        }}
        onLaunchError={(error) => {
          console.error('Launch failed:', error);
        }}
        onLaunchSuccess={(data) => {
          console.log('Token launched successfully:', data);
        }}
      />
    </div>
  );
}
```

#### Types
```
interface SuccessResponseData {
  publicKey: string; // The user's base account
  tokenAccount: string; // The user's token account
  wsolAccount: string: // The user's WSOL account
  tx: string; // Transaction hash
  tokenUrl: string;
}

interface MintButtonProps = {
  network: keyof NetworkConfigs;
  mintAddress: string;
  urcCode: string;
  wallet: AnchorWallet;
  connection: Connection;
  showRefundButton: boolean;
  showUrcButton: boolean;
  mintButtonTitle?: string;
  mintButtonStyle?: Object;
  refundButtonStyle?: Object;
  refundButtonTitle?: string;
  informationStyle?: Object;
  generateURCStyle?: Object;
  flipflopLogoStyle?: Object;
  onMintStart?: () => void;
  onMintError?: (error: string) => void;
  onMintSuccess?: (data: SuccessResponseData) => void;
  onRefundStart?: () => void;
  onRefundError?: (error: string) => void;
  onRefundSuccess?: (data: SuccessResponseData) => void;
};

interface TokenMetadataIPFS {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

interface LaunchSuccessData {
  mintAddress: string;
  signature: string;
  metadataUri?: string;
  imageUri?: string;
}

interface LaunchTokenButtonProps {
  network: keyof NetworkConfigs;
  wallet: AnchorWallet;
  connection: Connection;
  metadata: TokenMetadataIPFS;
  imageFileForUpload?: File | Blob;
  metadataForUpload?: TokenMetadataIPFS;
  buttonTitle?: string;
  buttonStyle?: CSSProperties;
  onLaunchStart?: () => void;
  onLaunchError?: (error: string) => void;
  onLaunchSuccess?: (data: LaunchSuccessData) => void;
};
```

## 🎨 Styling & Customization
### Default Styles
The component comes with sensible defaults that can be overridden:

```
export const defaultMintButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
};

export const defaultRefundButtonStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  cursor: 'pointer',
}

export const defaultInformationStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '12px',
}

export const defaultGenerateURCStyle = {
  display: 'flex',
  justifyContent: 'center',
  fontSize: '14px',
}

export const defaultFlipflopLogoStyle = {
  display: 'flex',
  justifyContent: 'center',
}

export const defaultLaunchTokenButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}
```

### Custom Styling Example
```
  <MintButton
    network={network}
    mintAddress={mintAddress}
    urcCode={urcCode}
    wallet={anchorWallet}
    connection={connection}
    onMintStart={onStart}
    onMintError={onError}
    onMintSuccess={onSuccess}
    onRefundSuccess={onSuccess}
    onRefundStart={onStart}
    onRefundError={onError}
    mintButtonTitle="Donate"
    mintButtonStyle={{
      width: '100%',
      backgroundColor: 'green',
      color: 'white',
      border: '1px solid white',
      borderRadius: '5px',
      padding: '10px',
      margin: 'auto',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      letterSpacing: '1px',
    }}
    showRefundButton={true}
    showUrcButton={false}
    refundButtonTitle="Refund"
    refundButtonStyle={{
      width: '100%',
      backgroundColor: 'red',
      color: 'white',
      border: '1px solid white',
      borderRadius: '5px',
      padding: '10px',
      margin: 'auto',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      letterSpacing: '1px',
    }}
    informationStyle={{
      display: 'flex',
      justifyContent: 'left',
      color: 'gray',
      fontSize: '14px',
      textAlign: 'left',
      margin: '10px auto'
    }}
    generateURCStyle={{
      display: 'flex',
      justifyContent: 'center',
      color: 'gray',
      margin: '10px auto'
    }}
    flipflopLogoStyle={{
      marginTop: '20px'
    }}
  />
```

## 🔧 Advanced Usage

### LaunchTokenButton Advanced Usage

#### File Validation
```typescript
const validateImageFile = (file: File): string | null => {
  // Check file size (max 250KB)
  if (file.size > 250 * 1024) {
    return 'Image file must be under 250KB';
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }
  
  // Check if image is square (optional)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width !== img.height) {
        resolve('Image must be square (1:1 aspect ratio)');
      } else {
        resolve(null);
      }
    };
    img.src = URL.createObjectURL(file);
  });
};

function TokenLauncherWithValidation() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = await validateImageFile(file);
    if (error) {
      setValidationError(error);
      setImageFile(null);
    } else {
      setValidationError(null);
      setImageFile(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isLaunching}
      />
      {validationError && (
        <p style={{ color: 'red' }}>{validationError}</p>
      )}
      
      <LaunchTokenButton
        // ... other props
        imageFileForUpload={imageFile}
        buttonTitle={isLaunching ? 'Launching...' : 'Launch Token'}
        buttonStyle={{
          ...defaultLaunchTokenButtonStyle,
          opacity: isLaunching || validationError ? 0.6 : 1,
          cursor: isLaunching || validationError ? 'not-allowed' : 'pointer',
        }}
        onLaunchStart={() => setIsLaunching(true)}
        onLaunchSuccess={(data) => {
          setIsLaunching(false);
          console.log('Token launched:', data);
        }}
        onLaunchError={(error) => {
          setIsLaunching(false);
          console.error('Launch failed:', error);
        }}
      />
    </div>
  );
}
```

### Error Handling
```
const handleMintError = (error: string) => {
  // Custom error handling logic
  console.error('Mint failed:', error);
  
  // Show user-friendly error message
  toast.error(`Minting failed: ${error}`);
  
  // Track error for analytics
  analytics.track('mint_error', { error, mintAddress });
};

<MintButton
  // ... other props
  onMintError={handleMintError}
  onRefundError={handleRefundError}
/>
```
### Success Handling
```
const handleMintSuccess = (data: SuccessResponseData) => {
  console.log('Mint successful:', data);
  
  // Show success message
  toast.success(`Successfully minted! Signature: ${data.signature}`);
  
  // Redirect or update UI
  router.push(`/transaction/${data.signature}`);
  
  // Track success for analytics
  analytics.track('mint_success', data);
};

<MintButton
  // ... other props
  onMintSuccess={handleMintSuccess}
  onRefundSuccess={handleRefundSuccess}
/>
```

### Loading States
```
const [isMinting, setIsMinting] = useState(false);

<MintButton
  // ... other props
  buttonTitle={isMinting ? 'Minting...' : 'Mint Token'}
  buttonStyle={{
    ...defaultButtonStyle,
    opacity: isMinting ? 0.7 : 1,
    cursor: isMinting ? 'not-allowed' : 'pointer',
  }}
  onStart={() => setIsMinting(true)}
  onSuccess={() => setIsMinting(false)}
  onError={() => setIsMinting(false)}
/>
```

## 🏗️ Development
### Building from Source
```
# Clone the repository
git clone https://github.com/flipflop-fun/sdk.git
cd flipflop-sdk

# Install dependencies
npm install

# Build the project
npm run build

# link the package
npm link

# Then in the example project, run:
npm link @flipflop-fun/sdk
```

### React + Vite Integration
If run in vite, and got error: `Buffer is not defined`, please add following code:
```
// main.tsx
import { Buffer } from 'buffer';
import process from 'process';

window.global = window;
window.Buffer = Buffer;
window.process = process;

// Your app code
import App from './App';
ReactDOM.render(<App />, document.getElementById('root'));
```

And in `vite.config.ts`, add:
```
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
export default defineConfig({
  // ...
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    },
    force: true,
    include: [
      '@solana/web3.js',
      '@solana/spl-token',
      '@solana/spl-token-metadata',
      '@flipflop-sdk/tools',
      'buffer'
    ],
    // ...
  }
})
```

## 🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Make your changes
4. Add tests if applicable
5. Commit your changes: git commit -m 'Add amazing feature'
6. Push to the branch: git push origin feature/amazing-feature
7. Open a Pull Request
## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links
- [FlipFlop Website](https://flipflop.plus)
- Documentation
- GitHub Repository
- NPM Package
- Discord Community

## 🏷️ Changelog
See CHANGELOG.md for a detailed history of changes.

Built with ❤️ by the FlipFlop Team
