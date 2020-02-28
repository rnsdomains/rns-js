import Web3 from 'web3';
import RNS from '../../src/index';
import { NO_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_ADDR_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe('addr resolution', () => {
  describe('should resolve a name', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('testing.rsk');
      expect(addr).toBe('0x0000000000000000000000000000000001000006');
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const addr = await rns.addr('testing.rsk');
      expect(addr).toBe('0x0000000000000000000000000000000001000006');
    });
  });

  describe('should throw an error when resolver has not been set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noresolver.testing.rsk'), NO_RESOLVER);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noresolver.testing.rsk'), NO_RESOLVER);
    });
  });

  describe('should throw an error when resolver does not support addr interface', () => {
    describe('ERC165 contract as resolver that not implements addr method', () => {
      // resolver address is the NameResolver contract. an ERC165 that not supports addr interface
      test('mainnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => rns.addr('noaddrresolver.testing.rsk'), NO_ADDR_RESOLUTION);
      });

      test('testnet with another ERC165  as resolver', async () => {
        const web3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => rns.addr('noaddrresolver.testing.rsk'), NO_ADDR_RESOLUTION);
      });
    });

    describe('non contract address as a resolver', () => {
      test('mainnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => rns.addr('accountasresolver.testing.rsk'), NO_ADDR_RESOLUTION);
      });

      test('testnet', async () => {
        const web3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(web3);
        await asyncExpectThrowError(async () => rns.addr('accountasresolver.testing.rsk'), NO_ADDR_RESOLUTION);
      });
    });
  });

  describe('should throw an error when no resolution set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noresolution.testing.rsk'), NO_ADDR_RESOLUTION_SET);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noresolution.testing.rsk'), NO_ADDR_RESOLUTION_SET);
    });
  });

  describe('should throw an error when domain do not exist', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noexist.testing.rsk'), NO_RESOLVER);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => rns.addr('noexist.testing.rsk'), NO_RESOLVER);
    });
  });
});
