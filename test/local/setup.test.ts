import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import { web3 } from '@openzeppelin/test-environment';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { LIBRARY_NOT_COMPOSED, NO_ADDRESSES_PROVIDED } from '../../src/errors';
import {
  asyncExpectThrowRNSError, expectThrowRNSError, asyncExpectThrowError,
  PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import RNS from '../../src/index';
import { NetworkId } from '../../src/types';
import { deployRegistryAndCreateTldNode, getRNSInstance } from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - library setup', (name, blockchainApiInstance) => {
  it('should set custom address if provided', async () => {
    const registry = await deployRegistryAndCreateTldNode();

    const rns = getRNSInstance(blockchainApiInstance, registry);

    await rns.compose();
    expect(rns.contracts.registry.options.address).toBe(registry.address);
  });

  it('should fail when getting contracts if library not composed', () => {
    const rns = new RNS(blockchainApiInstance);
    expectThrowRNSError(() => rns.contracts, LIBRARY_NOT_COMPOSED);
  });

  it('should fail when getting currentNetworkId if library not composed', () => {
    const rns = new RNS(blockchainApiInstance);
    expectThrowRNSError(() => rns.currentNetworkId, LIBRARY_NOT_COMPOSED);
  });

  it('should fail when compose if invalid network', () => {
    const invalidWeb3 = new Web3('https://invalid.rsk.co');
    const rns = new RNS(invalidWeb3);
    asyncExpectThrowError(() => rns.compose());
  });

  it('should fail when compose if custom network and no addresses provided', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(() => rns.compose(), NO_ADDRESSES_PROVIDED);
  });

  describe('public nodes', () => {
    describe('should return registry address after compose', () => {
      test('mainnet', async () => {
        const publicWeb3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(publicWeb3);
        await rns.compose();
        expect(rns.contracts.registry.options.address.toLowerCase())
          .toBe(RNSRegistryData.address.rskMainnet);
      });

      test('testnet', async () => {
        const publicWeb3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(publicWeb3);
        await rns.compose();
        expect(rns.contracts.registry.options.address.toLowerCase())
          .toBe(RNSRegistryData.address.rskTestnet);
      });
    });

    describe('should return networkId after compose', () => {
      test('mainnet', async () => {
        const publicWeb3 = new Web3(PUBLIC_NODE_MAINNET);
        const rns = new RNS(publicWeb3);
        await rns.compose();
        expect(rns.currentNetworkId).toBe(NetworkId.RSK_MAINNET);
      });

      test('testnet', async () => {
        const publicWeb3 = new Web3(PUBLIC_NODE_TESTNET);
        const rns = new RNS(publicWeb3);
        await rns.compose();
        expect(rns.currentNetworkId).toBe(NetworkId.RSK_TESTNET);
      });
    });
  });
});
