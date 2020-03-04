import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import { NO_CHAIN_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options, ChainId } from '../../src/types';
import { labelhash } from '../../src/utils';

describe('chainAddr resolution', () => {
  const [anotherAccount] = accounts;

  const TLD = 'rsk';

  let registry: any;
  let multichainResolver: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;

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

    rns = new RNS(web3Instance, options);
  });

  it('should resolve a name for BTC', async () => {
    const btcAddress = '1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.BITCOIN_MAINNET, btcAddress);

    const addr = await rns.addr('alice.rsk', ChainId.BITCOIN_MAINNET);
    expect(addr).toBe(btcAddress);
  });

  it('should resolve a name for ETH', async () => {
    const ethAddress = '0x0000000000000000000000000000000000000001';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.ETHEREUM_MAINNET, ethAddress);

    const addr = await rns.addr('alice.rsk', ChainId.ETHEREUM_MAINNET);
    expect(addr).toBe(ethAddress);
  });


  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(async () => rns.addr('noresolver.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
  });

  describe('should throw an error when resolver does not support chainAddr interface', () => {
    it('ERC165 contract as resolver that not implements addr method', async () => {
      // the address is the NameResolver contract, an ERC165 that not supports chainAddr interface
      const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
      const nameResolver = await NameResolver.new(registry.address);

      await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
      await asyncExpectThrowRNSError(async () => rns.addr('anothererc165.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
    });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), anotherAccount);

      await asyncExpectThrowRNSError(async () => rns.addr('accountasresolver.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION);
    });
  });

  it('should throw an error when no resolution set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolution'), defaultSender);

    await asyncExpectThrowRNSError(async () => rns.addr('noresolution.rsk', ChainId.BITCOIN_MAINNET), NO_CHAIN_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(async () => rns.addr('noexists.rsk', ChainId.BITCOIN_MAINNET), NO_RESOLVER);
  });
});
