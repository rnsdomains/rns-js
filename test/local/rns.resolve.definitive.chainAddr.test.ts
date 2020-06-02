import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import ResolverV1Data from '@rsksmart/rns-resolver/ResolverV1Data.json';
import ProxyAdminData from '@rsksmart/rns-resolver/ProxyAdminData.json';
import ProxyFactoryData from '@rsksmart/rns-resolver/ProxyFactoryData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import { formatsByCoinType } from '@ensdomains/address-encoder';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { encodeCall } from '@openzeppelin/upgrades';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_CHAIN_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options, ChainId } from '../../src/types';
import { labelhash } from '../../src/utils';
import { CoinType } from '../../src/types/enums';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - chainAddr resolution', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  let proxy: any;
  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const ResolverV1 = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode);
    const ProxyFactory = contract.fromABI(ProxyFactoryData.abi, ProxyFactoryData.bytecode);
    const ProxyAdmin = contract.fromABI(ProxyAdminData.abi, ProxyAdminData.bytecode);

    registry = await Registry.new();
    const proxyFactory = await ProxyFactory.new();
    const proxyAdmin = await ProxyAdmin.new();
    const resolverV1 = await ResolverV1.new();

    const salt = '16';
    const data = encodeCall('initialize', ['address'], [registry.address]);
    await proxyFactory.deploy(salt, resolverV1.address, proxyAdmin.address, data);

    const resolverAddress = await proxyFactory.getDeploymentAddress(salt, defaultSender);

    proxy = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode, resolverAddress);

    await registry.setDefaultResolver(resolverAddress);

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  it('should resolve a name for BTC', async () => {
    const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const decoded = formatsByCoinType[CoinType.BITCOIN].decoder(btcAddress);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await proxy.methods['setAddr(bytes32,uint256,bytes)'](namehash('alice.rsk'), CoinType.BITCOIN, decoded, { from: defaultSender });

    const addr = await rns.addr('alice.rsk', ChainId.BITCOIN);
    expect(addr).toBe(btcAddress);
  });

  it('should resolve a name for ETH', async () => {
    const ethAddress = '0x0000000000000000000000000000000000000001';
    const decoded = formatsByCoinType[CoinType.ETHEREUM].decoder(ethAddress);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await proxy.methods['setAddr(bytes32,uint256,bytes)'](namehash('alice.rsk'), CoinType.ETHEREUM, decoded, { from: defaultSender });

    const addr = await rns.addr('alice.rsk', ChainId.ETHEREUM);
    expect(addr).toBe(ethAddress);
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
