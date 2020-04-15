import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import ReverseRegistrarData from '@rsksmart/rns-reverse/ReverseRegistrarData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import {
  contract, web3, defaultSender, accounts,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import { NO_REVERSE_RESOLUTION_SET, NO_NAME_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';

describe('name resolution', () => {
  let registry: any;
  let nameResolver: any;
  let reverseRegistrar: any;
  let rns: RNS;
  let options: Options;

  const web3Instance = web3 as unknown as Web3;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
    const ReverseRegistrar = contract.fromABI(
      ReverseRegistrarData.abi,
      ReverseRegistrarData.bytecode,
    );

    registry = await Registry.new();
    nameResolver = await NameResolver.new(registry.address);
    reverseRegistrar = await ReverseRegistrar.new(registry.address);

    await registry.setSubnodeOwner('0x00', labelhash('reverse'), defaultSender);
    await registry.setResolver(namehash('reverse'), nameResolver.address);
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), reverseRegistrar.address);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  it('should resolve an address', async () => {
    const [alice] = accounts;

    const expected = 'alice.rsk';
    await reverseRegistrar.setName(expected, { from: alice });
    const actual = await rns.reverse(alice);
    expect(actual).toBe(expected);
  });

  it('should throw an error when invalid ERC165 contract (account address) as reverse resolver', async () => {
    const [alice, accountAsResolver] = accounts;

    await reverseRegistrar.claimWithResolver(alice, accountAsResolver, { from: alice });
    await asyncExpectThrowRNSError(() => rns.reverse(alice), NO_NAME_RESOLUTION);
  });

  it('should throw an error when ERC165 that not support name interface (public resolver) as reverse resolver', async () => {
    const [alice] = accounts;
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    const publicResolver = await PublicResolver.new(registry.address);

    await reverseRegistrar.claimWithResolver(alice, publicResolver.address, { from: alice });
    await asyncExpectThrowRNSError(() => rns.reverse(alice), NO_NAME_RESOLUTION);
  });

  it('should throw an error when the address has a resolver but no resolution set', async () => {
    const [alice] = accounts;

    await reverseRegistrar.claim(alice, { from: alice });
    await asyncExpectThrowRNSError(() => rns.reverse(alice), NO_REVERSE_RESOLUTION_SET);
  });

  it('should throw an error when reverse resolution has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.reverse('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
  });
});
