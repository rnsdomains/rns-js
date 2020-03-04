import Web3 from 'web3';
import RNS from '../../src/index';
import { NO_REVERSE_RESOLUTION_SET, NO_NAME_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe('name resolution', () => {
  describe('should resolve an address', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const name = await rns.reverse('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
      expect(name).toBe('testing.rsk');
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const name = await rns.reverse('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
      expect(name).toBe('testing.rsk');
    });
  });

  describe('should throw an error when invalid ERC165 contract (account address) as reverse resolver', () => {
    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.reverse('0x799c63A0bd1FaB0D7E784f35766FB496766BB245'), NO_NAME_RESOLUTION);
    });
  });

  describe('should throw an error when ERC165 that not support name interface (public resolver) as reverse resolver', () => {
    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.reverse('0x1c0884e81161B526f6A4baBC557F97649a2c74CC'), NO_NAME_RESOLUTION);
    });
  });

  describe('should throw an error when the address has a resolver but no resolution set', () => {
    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.reverse('0x0BC10AFD0Fc8344Ac3bBDDEE72221F148Ee0Bc61'), NO_REVERSE_RESOLUTION_SET);
    });
  });

  describe('should throw an error when reverse resolution has not been set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.reverse('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.reverse('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
    });
  });
});
