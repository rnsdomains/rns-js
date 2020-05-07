import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { NO_CHAIN_ADDR_RESOLUTION, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION_SET } from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import { ChainId } from '../../src/types';

describe.each([
  new Web3(PUBLIC_NODE_MAINNET),
  new Web3(PUBLIC_NODE_TESTNET),
  new Rsk3(PUBLIC_NODE_MAINNET),
  new Rsk3(PUBLIC_NODE_TESTNET),
])('chainAddr resolution', (blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  test('should resolve a name for BTC', async () => {
    const addr = await rns.addr('multichain.testing.rsk', ChainId.BITCOIN);
    expect(addr).toBe('1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG');
  });

  test('should resolve a name for ETH', async () => {
    const addr = await rns.addr('multichain.testing.rsk', ChainId.ETHEREUM);
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  });

  test('should throw an error when resolver has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolver.multichain.testing.rsk', ChainId.BITCOIN), NO_RESOLVER);
  });

  describe('should throw an error when resolver does not support chain addr interface', () => {
    test('ERC165 contract as resolver that not implements addr method', async () => {
      // resolver address is the NameResolver contract. an ERC165 that not supports addr interface
      await asyncExpectThrowRNSError(() => rns.addr('nochainaddrresolver.multichain.testing.rsk', ChainId.BITCOIN), NO_CHAIN_ADDR_RESOLUTION);
    });

    test('non contract address as a resolver', async () => {
      await asyncExpectThrowRNSError(() => rns.addr('accountasresolver.multichain.testing.rsk', ChainId.BITCOIN), NO_CHAIN_ADDR_RESOLUTION);
    });
  });

  test('should throw an error when no resolution set', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolution.multichain.testing.rsk', ChainId.BITCOIN), NO_CHAIN_ADDR_RESOLUTION_SET);
  });

  test('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noexists.multichain.testing.rsk', ChainId.BITCOIN), NO_RESOLVER);
  });
});
