import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

export { default as MintButton } from './MintButton';
export { default as UrcButton } from './UrcButton';
export { default as RefundButton } from './RefundButton';
