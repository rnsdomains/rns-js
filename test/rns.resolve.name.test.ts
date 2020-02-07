import Web3 from 'web3';
import RNS from '../src/index';
import { NO_REVERSE_RESOLUTION_SET } from '../src/errors';
import { asyncExpectThrowError } from './utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe ('name resolution', () => {
  describe ('should resolve an address', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const name = await rns.reverseResolution('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
      expect(name).toBe('testing.rsk');
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const name = await rns.reverseResolution('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
      expect(name).toBe('testing.rsk');
    });
  });

  describe ('should throw an error when reverse resolution has not been set', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.reverseResolution('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowError(async () => await rns.reverseResolution('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
    });
  });
});
