import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import {
  contract, web3, defaultSender, accounts,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  NO_RESOLVER, INVALID_ADDRESS, NO_SET_ADDR, INVALID_CHECKSUM_ADDRESS, NO_ACCOUNTS_TO_SIGN,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setAddr', (name, blockchainApiInstance) => {
  const TLD = 'rsk';
  const addr = '0x0000000000000000000000000000000001000006';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;

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

    rns = new RNS(blockchainApiInstance, options);
  });

  it('should set an address if implements the multichain resolver', async () => {
    const MultichainResolver = contract.fromABI(
      ChainAddrResolverData.abi, ChainAddrResolverData.bytecode,
    );

    const multichainResolver = await MultichainResolver.new(
      registry.address, publicResolver.address,
    );

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await registry.setResolver(namehash('alice.rsk'), multichainResolver.address);

    await rns.setAddr('alice.rsk', addr);

    const actualAddr = await rns.addr('alice.rsk');
    expect(actualAddr).toBe(addr);
  });

  it('should set an address with public resolver', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', addr);

    const actualAddr = await rns.addr('alice.rsk');
    expect(actualAddr).toBe(addr);
  });

  it('should return a tx receipt when setting an address', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    const tx = await rns.setAddr('alice.rsk', addr);

    expect(tx.transactionHash).toBeTruthy();
  });

  it('should set an address when the library is instantiated with a different networkId', async () => {
    const options = {
      contractAddresses: {
        registry: registry.address,
      },
      networkId: 18,
    };

    rns = new RNS(blockchainApiInstance, options);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setAddr('alice.rsk', addr);

    const actualAddr = await rns.addr('alice.rsk');
    expect(actualAddr).toBe(addr);
  });

  it('should throw an error when address is invalid', async () => {
    await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', 'invalidaddress'), INVALID_ADDRESS);
  });

  it('should throw an error when address has invalid checksum', async () => {
    await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', '0x0000000000000000000000000000000001ABcdEF'), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.setAddr('noresolver.rsk', addr), NO_RESOLVER);
  });

  describe('should throw an error when resolver does not support setAddr interface', () => {
    it('ERC165 contract as resolver that not implements addr method', async () => {
      // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
      const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
      const nameResolver = await NameResolver.new(registry.address);

      await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);

      await asyncExpectThrowRNSError(() => rns.setAddr('anothererc165.rsk', addr), NO_SET_ADDR);
    });

    it('account address as a resolver', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('accountasresolver'), defaultSender);
      await registry.setResolver(namehash('accountasresolver.rsk'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.setAddr('accountasresolver.rsk', addr), NO_SET_ADDR);
    });
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', addr), NO_RESOLVER);
  });

  describe('custom tx options', () => {
    it('should send custom gasPrice', async () => {
      const gasPrice = 70000000;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gasPrice });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gasLimit', async () => {
      const gasLimit = 80000;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gasLimit });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gas).toEqual(gasLimit);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), from);

      const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { from });

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
])('%s - public nodes setAddr', (name, blockchainApiInstance) => {
  test('should fail when blockchain api instance does not contain accounts to sing the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
