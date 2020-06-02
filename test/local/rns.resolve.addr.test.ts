import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_ADDR_RESOLUTION } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - addr resolution', (name, blockchainApiInstance) => {
  const [resolution] = accounts;

  const TLD = 'rsk';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;
  let options: Options;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);

    await registry.setDefaultResolver(publicResolver.address);

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  it('should resolve a name', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await publicResolver.setAddr(namehash('alice.rsk'), resolution);

    const addr = await rns.addr('alice.rsk');
    expect(addr).toBe(resolution);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    asyncExpectThrowRNSError(() => rns.addr('noresolver.rsk'), NO_RESOLVER);
  });

  it('should throw an error when resolver does not support addr interface', async () => {
    // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
    const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
    const nameResolver = await NameResolver.new(registry.address);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
    await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
    asyncExpectThrowRNSError(() => rns.addr('anothererc165.rsk'), NO_ADDR_RESOLUTION);
  });

  it('should throw an error when no resolution set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolution'), defaultSender);

    asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk'), NO_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', () => {
    asyncExpectThrowRNSError(() => rns.addr('noexists.rsk'), NO_RESOLVER);
  });
});
