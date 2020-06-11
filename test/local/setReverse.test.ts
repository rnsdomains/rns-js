import { web3, defaultSender, accounts } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  NO_ACCOUNTS_TO_SIGN, NO_REVERSE_REGISTRAR, NO_SET_NAME_METHOD, INVALID_DOMAIN,
} from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { ZERO_ADDRESS } from '../../src/constants';
import {
  deployRegistryAndCreateTldNode, getRNSInstance, deployNameResolver, deployReverseRegistrar,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setReverse', (name, blockchainApiInstance) => {
  let registry: any;
  let nameResolver: any;
  let reverseRegistrar: any;
  let rns: RNS;

  beforeEach(async () => {
    registry = await deployRegistryAndCreateTldNode();

    nameResolver = await deployNameResolver(registry);
    reverseRegistrar = await deployReverseRegistrar(registry);

    await registry.setSubnodeOwner('0x00', labelhash('reverse'), defaultSender);
    await registry.setResolver(namehash('reverse'), nameResolver.address);
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), reverseRegistrar.address);

    rns = getRNSInstance(blockchainApiInstance, registry);
  });

  it('should set reverse resolution of an address', async () => {
    const expected = 'alice.rsk';

    await rns.setReverse(expected);

    const actual = await rns.reverse(defaultSender);

    expect(actual).toBe(expected);
  });

  it('should fail if sending an invalid domain', async () => {
    await asyncExpectThrowRNSError(() => rns.setReverse('INV-alid.rsk'), INVALID_DOMAIN);
  });

  it('should fail if no reverse registrar contract address', async () => {
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.setReverse('testing.rsk'), NO_REVERSE_REGISTRAR);
  });

  it('should fail if addr.reverse node owner is an account', async () => {
    const [alice] = accounts;
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), alice);

    await asyncExpectThrowRNSError(() => rns.setReverse('testing.rsk'), NO_SET_NAME_METHOD);
  });

  it('should fail if addr.reverse node owner is a contract that not implement setName method', async () => {
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), registry.address);

    await asyncExpectThrowRNSError(() => rns.setReverse('testing.rsk'), NO_SET_NAME_METHOD);
  });

  describe('custom tx options', () => {
    it('should send custom gasPrice', async () => {
      const gasPrice = '70000000';

      const txHash = await rns.setReverse('alice.rsk', { gasPrice });

      const tx = await web3.eth.getTransaction(txHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gas', async () => {
      const gas = 800000;

      const txHash = await rns.setReverse('alice.rsk', { gas });

      const tx = await web3.eth.getTransaction(txHash);

      expect(tx.gas).toEqual(gas);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      const txHash = await rns.setReverse('alice.rsk', { from });

      const tx = await web3.eth.getTransaction(txHash);

      expect(tx.from).toEqual(from);
    });
  });
});

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - public nodes setReverse', (name, blockchainApiInstance) => {
  test('should fail when blockchain api instance does not contain accounts to sing the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(() => rns.setReverse('testing.rsk'), NO_ACCOUNTS_TO_SIGN);
  });
});
