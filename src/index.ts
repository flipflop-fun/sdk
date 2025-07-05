import { Buffer } from 'buffer';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { SUBGRAPH_URL } from './config';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

export const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
  // headers: {
  //   'Authorization': `Bearer ${THEGRAPH_API_KEY}`
  // }
});

export { default as MintButton } from './MintButton';
export { default as UrcButton } from './UrcButton';
export { default as RefundButton } from './RefundButton';
