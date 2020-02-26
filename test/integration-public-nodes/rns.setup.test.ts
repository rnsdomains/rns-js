import Web3 from 'web3';
import RNS from '../../src/index';
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import { LIBRARY_NOT_COMPOSED, NO_ADDRESSES_PROVIDED } from '../../src/errors';
import { asyncExpectThrowError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe('library setup', () => {
  describe('should set custom address if provided', () => {
    const registryAddress = '0x0000000000000000000000000000000000000001';
    const options = { 
      contractAddresses: { registry: registryAddress } 
    };

    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET)
      const rns = new RNS(web3, options)
      await rns.compose()
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(registryAddress);
    })

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3, options);
      await rns.compose()
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(registryAddress)
    })
  });

  describe('should return registry address after compose', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET)
      const rns = new RNS(web3)
      await rns.compose()
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(RNSRegistryData.address.rskMainnet)
    })

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await rns.compose()
      expect(rns.contracts.registry.options.address.toLowerCase()).toBe(RNSRegistryData.address.rskTestnet)
    })
  });

  describe('should fail when getting contracts if library not composed', () => {
    test('mainnet', () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      let error;
      try {
        rns.contracts;
      } catch (_error) {
        error = _error.message;
      } finally {
        expect(error).toBe(LIBRARY_NOT_COMPOSED);
      };
    });

    test('testnet', () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET)
      const rns = new RNS(web3)
      let error;
      try {
        rns.contracts;
      } catch (_error) {
        error = _error.message;
      } finally {
        expect(error).toBe(LIBRARY_NOT_COMPOSED);
      };
    });
  });

  describe('should fail when compose if invalid network', () => {
    it('', async () => {
      const web3 = new Web3('https://invalid.rsk.co')
      const rns = new RNS(web3)
      await asyncExpectThrowError(async () => await rns.compose());
    });
  });
});
