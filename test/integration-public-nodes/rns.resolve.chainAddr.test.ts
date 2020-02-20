import Web3 from 'web3';
import RNS from '../../src/index';
import { NO_CHAIN_ADDR_RESOLUTION, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION_SET } from '../../src/errors';
import { asyncExpectThrowError } from '../utils';
import { ChainId } from '../../src/types';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe ('chainAddr resolution', () => {
  describe ('should resolve a name for BTC', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('multichain.testing.rsk', ChainId.BITCOIN_MAINNET);
      expect(addr).toBe('1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG');
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('multichain.testing.rsk', ChainId.BITCOIN_MAINNET);
      expect(addr).toBe('1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG');
    });
  });

  describe ('should resolve a name for ETH', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('multichain.testing.rsk', ChainId.ETHEREUM_MAINNET);
      expect(addr).toBe('0x0000000000000000000000000000000001000006');
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('multichain.testing.rsk', ChainId.ETHEREUM_MAINNET);
      expect(addr).toBe('0x0000000000000000000000000000000001000006');
    });
  });

  describe ('should throw an error when resolver has not been set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
    });
  });

  describe ('should throw an error when resolver does not support chain addr interface', () => {
    describe ('ERC165 contract as resolver that not implements addr method', () => {
      // the resolver address is the NameResolver contract. Is an ERC165 that not supports addr interface
      test('mainnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => await rns.addr('nochainaddrresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
      });

      test('testnet with another ERC165  as resolver', async () => {
        const web3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => await rns.addr('nochainaddrresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
      });
    });

    describe('non contract address as a resolver', () => {
      test('mainnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => await rns.addr('accountasresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
      });

      test('testnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => await rns.addr('accountasresolver.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
      });
    });
  });

  describe ('should throw an error when no resolution set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noresolution.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION_SET);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noresolution.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION_SET);
    });
  });

  describe ('should throw an error when domain do not exist', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noexist.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.addr('noexist.multichain.testing.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
    });
  });
});
