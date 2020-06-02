import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_CHAIN_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options, ChainId } from '../../src/types';
import { labelhash, toChecksumAddress } from '../../src/utils';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - chainAddr resolution', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let multichainResolver: any;
  let rns: RNS;
  let options: Options;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    const MultichainResolver = contract.fromABI(
      ChainAddrResolverData.abi, ChainAddrResolverData.bytecode,
    );

    registry = await Registry.new();
    const publicResolver = await PublicResolver.new(registry.address);
    multichainResolver = await MultichainResolver.new(registry.address, publicResolver.address);

    await registry.setDefaultResolver(multichainResolver.address);
    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  it('should resolve a name for BTC', async () => {
    const btcAddress = '1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.BITCOIN, btcAddress);

    const addr = await rns.addr('alice.rsk', ChainId.BITCOIN);
    expect(addr).toBe(btcAddress);
  });

  it('should resolve a name for ETH', async () => {
    const ethAddress = '0x0000000000000000000000000000000000000001';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.ETHEREUM, ethAddress);

    const addr = await rns.addr('alice.rsk', ChainId.ETHEREUM);
    expect(addr).toBe(toChecksumAddress(ethAddress));
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.addr('noresolver.rsk', ChainId.BITCOIN), NO_RESOLVER);
  });

  it('should throw an error when resolver does not support chainAddr interface', async () => {
    // the address is the NameResolver contract, an ERC165 that not supports chainAddr interface
    const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
    const nameResolver = await NameResolver.new(registry.address);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
    await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
    await asyncExpectThrowRNSError(() => rns.addr('anothererc165.rsk', ChainId.BITCOIN), NO_CHAIN_ADDR_RESOLUTION);
  });

  it('should throw an error when no resolution set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolution'), defaultSender);

    await asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk', ChainId.BITCOIN), NO_CHAIN_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noexists.rsk', ChainId.BITCOIN), NO_RESOLVER);
  });
});
