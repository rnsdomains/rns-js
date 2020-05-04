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
  NO_RESOLVER, NO_SET_CHAIN_ADDR, NO_ACCOUNTS_TO_SIGN, INVALID_CHECKSUM_ADDRESS,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { ChainId } from '../../src/types';
import { labelhash } from '../../src/utils';

describe('setAddr', () => {
  const TLD = 'rsk';
  const rskAddr = '0x0000000000000000000000000000000001000006';
  const ethAddr = '0x0000000000000000000000000000000012345678';
  const btcAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

  let registry: any;
  let multichainResolver: any;
  let rns: RNS;
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

    const options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  it('should set an address for RSK', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

    const actualAddr = await rns.addr('alice.rsk', ChainId.RSK);
    expect(actualAddr).toBe(rskAddr);
  });

  it('should set an address for ETH', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', ethAddr, ChainId.ETHEREUM);

    const actualAddr = await rns.addr('alice.rsk', ChainId.ETHEREUM);
    expect(actualAddr).toBe(ethAddr);
  });

  it('should set an address for BTC', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', btcAddr, ChainId.BITCOIN);

    const actualAddr = await rns.addr('alice.rsk', ChainId.BITCOIN);
    expect(actualAddr).toBe(btcAddr);
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

  describe('should throw an error when resolver does not support setAddr interface', () => {
    it('ERC165 contract as resolver that not implements addr method', async () => {
      // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
      const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
      const nameResolver = await NameResolver.new(registry.address);

      await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);

      await asyncExpectThrowRNSError(() => rns.setAddr('anothererc165.rsk', rskAddr, ChainId.RSK), NO_SET_CHAIN_ADDR);
    });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.setAddr('accountasresolver.rsk', rskAddr, ChainId.RSK), NO_SET_CHAIN_ADDR);
    });
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', rskAddr), NO_RESOLVER);
  });

  describe('public nodes', () => {
    describe('should fail when web3 instance does not contain accounts to sing the tx', () => {
      describe('mainnet', () => {
        beforeEach(() => {
          const publicWeb3 = new Web3(PUBLIC_NODE_MAINNET);
          rns = new RNS(publicWeb3);
        });

        test('setAddr', async () => {
          await asyncExpectThrowRNSError(
            () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001', ChainId.ETHEREUM),
            NO_ACCOUNTS_TO_SIGN,
          );
        });
      });

      describe('testnet', () => {
        beforeEach(() => {
          const publicWeb3 = new Web3(PUBLIC_NODE_TESTNET);
          rns = new RNS(publicWeb3);
        });

        test('setAddr', async () => {
          await asyncExpectThrowRNSError(
            () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001', ChainId.ETHEREUM),
            NO_ACCOUNTS_TO_SIGN,
          );
        });
      });
    });
  });
});
