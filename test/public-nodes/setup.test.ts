import Web3 from 'web3';
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import RNS from '../../src/index';
import { LIBRARY_NOT_COMPOSED } from '../../src/errors';
import {
  expectThrowRNSError, asyncExpectThrowError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import { NetworkId } from '../../src/types';

describe('library setup', () => {
  describe('should set custom address if provided', () => {
    const registryAddress = '0x0000000000000000000000000000000000000001';
    const options = {
      contractAddresses: { registry: registryAddress },
    };

    it('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3, options);
      await rns.compose();
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(registryAddress);
    });

    it('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3, options);
      await rns.compose();
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(registryAddress);
    });
  });

  describe('should return registry address after compose', () => {
    it('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await rns.compose();
      expect(rns.contracts.registry.options.address.toLowerCase())
        .toBe(RNSRegistryData.address.rskMainnet);
    });

    it('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await rns.compose();
      expect(rns.contracts.registry.options.address.toLowerCase())
        .toBe(RNSRegistryData.address.rskTestnet);
    });
  });

  describe('should return networkId after compose', () => {
    it('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await rns.compose();
      expect(rns.currentNetworkId).toBe(NetworkId.RSK_MAINNET);
    });

    it('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await rns.compose();
      expect(rns.currentNetworkId).toBe(NetworkId.RSK_TESTNET);
    });
  });

  describe('should fail when getting contracts if library not composed', () => {
    it('mainnet', () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      expectThrowRNSError(() => rns.contracts, LIBRARY_NOT_COMPOSED);
    });

    it('testnet', () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      expectThrowRNSError(() => rns.contracts, LIBRARY_NOT_COMPOSED);
    });
  });

  it('should fail when compose if invalid network', async () => {
    const web3 = new Web3('https://invalid.rsk.co');
    const rns = new RNS(web3);
    await asyncExpectThrowError(() => rns.compose());
  });
});
