import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import {
  NO_RESOLVER, NO_CONTENTHASH_INTERFACE, NO_CONTENTHASH_SET,
} from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_TESTNET } from '../utils';

describe.each([
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk3 testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - contenthash resolution', (name, blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  it('should resolve a contenthash', async () => {
    const contenthash = await rns.contenthash('definitive.testing.rsk');

    expect(contenthash.decoded).toBe('QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4');
    expect(contenthash.protocolType).toBe('ipfs');
  });

  it('should throw an error when resolver has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.contenthash('noresolver.testing.rsk'), NO_RESOLVER);
  });

  it('should throw an error when resolver does not implement contenthash interface', async () => {
    // resolver address is the NameResolver contract. an ERC165 that not supports addr interface
    await asyncExpectThrowRNSError(() => rns.contenthash('noaddrresolver.testing.rsk'), NO_CONTENTHASH_INTERFACE);
  });

  it('should throw an error when no contenthash', async () => {
    await asyncExpectThrowRNSError(() => rns.contenthash('addr.definitive.testing.rsk'), NO_CONTENTHASH_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.contenthash('noexists.testing.rsk'), NO_RESOLVER);
  });
});
