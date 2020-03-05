import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import {
  NO_RESOLVER, NO_SET_CHAIN_ADDR,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options, ChainId } from '../../src/types';
import { labelhash } from '../../src/utils';

describe('setChainAddr', () => {
  const TLD = 'rsk';
  const rskAddr = '0x0000000000000000000000000000000001000006';
  const btcAddr = '1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG';

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

  it('should set an rsk address', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK_MAINNET);

    const actualAddr = await rns.addr('alice.rsk', ChainId.RSK_MAINNET);
    expect(actualAddr).toBe(rskAddr);
  });

  it('should set a btc address', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', btcAddr, ChainId.BITCOIN_MAINNET);

    const actualAddr = await rns.addr('alice.rsk', ChainId.BITCOIN_MAINNET);
    expect(actualAddr).toBe(btcAddr);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(async () => rns.setAddr('noresolver.rsk', btcAddr, ChainId.BITCOIN_MAINNET), NO_RESOLVER);
  });

  describe('should throw an error when resolver does not support setChainAddr interface', () => {
    it('ERC165 contract as resolver that not implements addr method', async () => {
      // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
      const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
      const nameResolver = await NameResolver.new(registry.address);

      await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);

      await asyncExpectThrowRNSError(async () => rns.setAddr('anothererc165.rsk', btcAddr, ChainId.BITCOIN_MAINNET), NO_SET_CHAIN_ADDR);
    });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), defaultSender);

      await asyncExpectThrowRNSError(async () => rns.setAddr('accountasresolver.rsk', btcAddr, ChainId.BITCOIN_MAINNET), NO_SET_CHAIN_ADDR);
    });
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(async () => rns.setAddr('noexists.rsk', btcAddr, ChainId.BITCOIN_MAINNET), NO_RESOLVER);
  });
});
