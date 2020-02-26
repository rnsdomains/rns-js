import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import { accounts, contract, web3, defaultSender } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import { NO_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_ADDR_RESOLUTION } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';

describe ('addr resolution', () => {
  const [ resolution, anotherAccount ] = accounts;

  const TLD = 'rsk';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);
    
    await registry.setDefaultResolver(publicResolver.address);

    await registry.setSubnodeOwner('0x00', web3.utils.sha3(TLD), defaultSender);

    options = { 
      contractAddresses: {
        registry: registry.address
      }
    }

    rns = new RNS(web3Instance, options);
  });

  it ('should resolve a name', async () => {
    await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('alice'), defaultSender);
    await publicResolver.setAddr(namehash('alice.rsk'), resolution);

    const addr = await rns.addr('alice.rsk');
    expect(addr).toBe(resolution);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);
    
    await asyncExpectThrowError(async () => await rns.addr('noresolver.rsk'), NO_RESOLVER);
  });

  describe ('should throw an error when resolver does not support addr interface', () => {
  //   it('ERC165 contract as resolver that not implements addr method', async () => {
  //     // the resolver address is the NameResolver contract. Is an ERC165 that not supports addr interface
  //     const web3 = new Web3(PUBLIC_NODE_TESTNET);
  //     const rns = new RNS(web3);
  //     await asyncExpectThrowError(async () => await rns.addr('noaddrresolver.testing.rsk'), NO_ADDR_RESOLUTION);
  //   });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), anotherAccount);

      await asyncExpectThrowError(async () => await rns.addr('accountasresolver.rsk'), NO_ADDR_RESOLUTION);
    });
  });

  it('should throw an error when no resolution set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('noresolution'), defaultSender);

    await asyncExpectThrowError(async () => await rns.addr('noresolution.rsk'), NO_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowError(async () => await rns.addr('noexists.rsk'), NO_RESOLVER);
  });
});