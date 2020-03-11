import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import {
  NO_RESOLVER, INVALID_ADDRESS, NO_SET_ADDR, INVALID_CHECKSUM_ADDRESS,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';

describe('setAddr', () => {
  const TLD = 'rsk';
  const addr = '0x0000000000000000000000000000000001000006';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;
  const web3Instance = web3 as unknown as Web3;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);

    await registry.setDefaultResolver(publicResolver.address);

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    const options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  it('should set an address', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', addr);

    const actualAddr = await rns.addr('alice.rsk');
    expect(actualAddr).toBe(addr);
  });

  it('should set an address when the library is instantiated with a different networkId', async () => {
    const options = {
      contractAddresses: {
        registry: registry.address,
      },
      networkId: 18,
    };

    rns = new RNS(web3Instance, options);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', addr);

    const actualAddr = await rns.addr('alice.rsk');
    expect(actualAddr).toBe(addr);
  });

  it('should throw an error when address is invalid', async () => {
    await asyncExpectThrowRNSError(async () => rns.setAddr('alice.rsk', 'invalidaddress'), INVALID_ADDRESS);
  });

  it('should throw an error when address has invalid checksum', async () => {
    await asyncExpectThrowRNSError(async () => rns.setAddr('alice.rsk', '0x0000000000000000000000000000000001ABcdEF'), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(async () => rns.setAddr('noresolver.rsk', addr), NO_RESOLVER);
  });

  describe('should throw an error when resolver does not support setAddr interface', () => {
    it('ERC165 contract as resolver that not implements addr method', async () => {
      // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
      const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
      const nameResolver = await NameResolver.new(registry.address);

      await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);

      await asyncExpectThrowRNSError(async () => rns.setAddr('anothererc165.rsk', addr), NO_SET_ADDR);
    });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), defaultSender);

      await asyncExpectThrowRNSError(async () => rns.setAddr('accountasresolver.rsk', addr), NO_SET_ADDR);
    });
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(async () => rns.setAddr('noexists.rsk', addr), NO_RESOLVER);
  });
});
