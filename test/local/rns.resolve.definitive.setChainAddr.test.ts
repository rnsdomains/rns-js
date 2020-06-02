import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import ResolverV1Data from '@rsksmart/rns-resolver/ResolverV1Data.json';
import ProxyAdminData from '@rsksmart/rns-resolver/ProxyAdminData.json';
import ProxyFactoryData from '@rsksmart/rns-resolver/ProxyFactoryData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import { formatsByCoinType } from '@ensdomains/address-encoder';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { encodeCall } from '@openzeppelin/upgrades';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_CHAIN_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION, NO_ACCOUNTS_TO_SIGN, INVALID_CHECKSUM_ADDRESS } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
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
  const rskAddr = '0x0000000000000000000000000000000001000006';
  const ethAddr = '0x0000000000000000000000000000000012345678';
  const btcAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

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

  it('should set an address for RSK', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

    const decodedAddr = await proxy.methods['addr(bytes32,uint256)'](
      namehash('alice.rsk'),
      CoinType.RSK
    );
    
    const buff = Buffer.from(decodedAddr.replace('0x', ''), 'hex');

    expect(formatsByCoinType[CoinType.RSK].encoder(buff)).toBe(rskAddr);
  });

  it('should set an address for ETH', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', ethAddr, ChainId.ETHEREUM);

    const decodedAddr = await proxy.methods['addr(bytes32,uint256)'](
      namehash('alice.rsk'),
      CoinType.ETHEREUM
    );
    
    const buff = Buffer.from(decodedAddr.replace('0x', ''), 'hex');

    expect(formatsByCoinType[CoinType.ETHEREUM].encoder(buff)).toBe(ethAddr);
  });

  it('should set an address for BTC', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', btcAddr, ChainId.BITCOIN);

    const decodedAddr = await proxy.methods['addr(bytes32,uint256)'](
      namehash('alice.rsk'),
      CoinType.BITCOIN
    );
    
    const buff = Buffer.from(decodedAddr.replace('0x', ''), 'hex');

    expect(formatsByCoinType[CoinType.BITCOIN].encoder(buff)).toBe(btcAddr);
  });

  it('should return a tx receipt when setting an address', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    const tx = await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

    expect(tx.transactionHash).toBeTruthy();
  });

  it('should throw an error when invalid checksum for RSK', async () => {
    const address = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // valid for ethereum

    await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', address, ChainId.RSK), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when invalid checksum for Ethereum', async () => {
    const address = '0x53Bf4d5cF81F8c52644912cfaE4d0E3EA7FAdD5b'; // valid for rsk mainnet

    await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', address, ChainId.ETHEREUM), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.setAddr('noresolver.rsk', rskAddr, ChainId.RSK), NO_RESOLVER);
  });

  // describe('should throw an error when resolver does not support setAddr interface', () => {
  //   it('ERC165 contract as resolver that not implements addr method', async () => {
  //     // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
  //     const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
  //     const nameResolver = await NameResolver.new(registry.address);

  //     await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
  //     await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);

  //     await asyncExpectThrowRNSError(() => rns.setAddr('anothererc165.rsk', rskAddr, ChainId.RSK), NO_SET_CHAIN_ADDR);
  //   });

  //   it('account address as a resolver', async () => {
  //     await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
  //     await registry.setResolver(namehash('accountasresolver.rsk'), defaultSender);

  //     await asyncExpectThrowRNSError(() => rns.setAddr('accountasresolver.rsk', rskAddr, ChainId.RSK), NO_SET_CHAIN_ADDR);
  //   });
  // });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', rskAddr), NO_RESOLVER);
  });

  describe('custom tx options', () => {
    it('should send custom gasPrice', async () => {
      const gasPrice = '70000000';

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', btcAddr, ChainId.BITCOIN, { gasPrice });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gas', async () => {
      const gas = 800000;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', ethAddr, ChainId.ETHEREUM, { gas });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gas).toEqual(gas);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), from);

      const txReceipt = await rns.setAddr('alice.rsk', ethAddr, ChainId.ETHEREUM, { from });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.from).toEqual(from);
    });
  });
});

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - public nodes setChainAddr', (name, blockchainApiInstance) => {
  test('should fail when blockchain api instance does not contain accounts to sing the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001', ChainId.ETHEREUM),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
