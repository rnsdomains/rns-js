import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import {
  contract, web3, defaultSender, accounts,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  NO_RESOLVER, INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS, NO_ACCOUNTS_TO_SIGN,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { deployDefinitiveResolver } from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setAddr', (name, blockchainApiInstance) => {
  const TLD = 'rsk';
  const addr = '0x0000000000000000000000000000000001000006';

  let registry: any;
  let rns: RNS;

  beforeEach(async () => {
    ({ registry } = await deployDefinitiveResolver());

    const options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  it('should set an address if implements the multichain resolver', async () => {
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    const publicResolver = await PublicResolver.new(registry.address);

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

  it('should set an address with definitive resolver', async () => {
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

  it('should throw an error when address is invalid', () => {
    asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', 'invalidaddress'), INVALID_ADDRESS);
  });

  it('should throw an error when address has invalid checksum', () => {
    asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', '0x0000000000000000000000000000000001ABcdEF'), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    asyncExpectThrowRNSError(() => rns.setAddr('noresolver.rsk', addr), NO_RESOLVER);
  });

  it('should throw an error when domain do not exist', () => {
    asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', addr), NO_RESOLVER);
  });

  describe('custom tx options', () => {
    it('should send custom gasPrice', async () => {
      const gasPrice = '70000000';

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gasPrice });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gas', async () => {
      const gas = 80000;

      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

      const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gas });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gas).toEqual(gas);
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
  test('should fail when blockchain api instance does not contain accounts to sing the tx', () => {
    const rns = new RNS(blockchainApiInstance);
    asyncExpectThrowRNSError(
      () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
