import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import { contract, web3 } from '@openzeppelin/test-environment';
import Web3 from 'web3';
import { LIBRARY_NOT_COMPOSED, NO_ADDRESSES_PROVIDED } from '../../src/errors';
import {
  asyncExpectThrowRNSError, expectThrowRNSError, asyncExpectThrowError,
  PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import RNS, { NetworkId } from '../../src/index';

describe('library setup', () => {
  const web3Instance = web3 as unknown as Web3;

  it('should set custom address if provided', async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const registry = await Registry.new();
    const registryAddress = registry.address;
    const options = {
      contractAddresses: { registry: registryAddress },
    };

    const rns = new RNS(web3Instance, options);

    await rns.compose();
    expect(rns.contracts.registry.options.address).toBe(registryAddress);
  });

  it('should fail when getting contracts if library not composed', () => {
    const rns = new RNS(web3Instance);
    expectThrowRNSError(() => rns.contracts, LIBRARY_NOT_COMPOSED);
  });

  it('should fail when getting currentNetworkId if library not composed', () => {
    const rns = new RNS(web3Instance);
    expectThrowRNSError(() => rns.currentNetworkId, LIBRARY_NOT_COMPOSED);
  });

  it('should fail when compose if invalid network', async () => {
    const invalidWeb3 = new Web3('https://invalid.rsk.co');
    const rns = new RNS(invalidWeb3);
    await asyncExpectThrowError(async () => rns.compose());
  });

  it('should fail when compose if custom network and no addresses provided', async () => {
    const rns = new RNS(web3Instance);
    await asyncExpectThrowRNSError(async () => rns.compose(), NO_ADDRESSES_PROVIDED);
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
