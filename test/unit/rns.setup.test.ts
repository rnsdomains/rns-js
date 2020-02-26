import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import { contract, web3 } from '@openzeppelin/test-environment';
import { LIBRARY_NOT_COMPOSED, NO_ADDRESSES_PROVIDED } from '../../src/errors';
import { asyncExpectThrowError } from '../utils';
import RNS from '../../src/index';
import Web3 from 'web3';

describe('library setup', () => {
  const web3Instance = web3 as unknown as Web3;

  it('should set custom address if provided', async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const registry = await Registry.new();
    const registryAddress = registry.address;
    const options = { 
      contractAddresses: { registry: registryAddress } 
    };

    const rns = new RNS(web3Instance, options);

    await rns.compose()
    expect(rns.contracts.registry.options.address).toBe(registryAddress);
  });

  it('should fail when getting contracts if library not composed', () => {
    const rns = new RNS(web3Instance);
    let error;
    try {
      rns.contracts;
    } catch (_error) {
      error = _error.message;
    } finally {
      expect(error).toBe(LIBRARY_NOT_COMPOSED);
    };
  });

  it('should fail when compose if invalid network', async () => {
    const web3 = new Web3('https://invalid.rsk.co');
    const rns = new RNS(web3);
    await asyncExpectThrowError(async () => await rns.compose());
  });

  it('should fail when compose if custom network and no addresses provided', async () => {
    const rns = new RNS(web3Instance);
    await asyncExpectThrowError(async () => await rns.compose(), NO_ADDRESSES_PROVIDED);
  });
});