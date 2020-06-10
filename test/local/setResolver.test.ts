import {
  web3, defaultSender, accounts,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS, DOMAIN_NOT_EXISTS, NO_ACCOUNTS_TO_SIGN,
} from '../../src/errors';
import {
  asyncExpectThrowRNSError, asyncExpectThrowVMRevert, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { deployRegistryAndCreateTldNode, getRNSInstance } from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setResolver', (name, blockchainApiInstance) => {
  let registry: any;
  let rns: RNS;

  beforeEach(async () => {
    registry = await deployRegistryAndCreateTldNode();

    rns = getRNSInstance(blockchainApiInstance, registry);
  });

  it('should set a resolver address', async () => {
    const addr = '0x0000000000000000000000000000000001000006';

    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    await rns.setResolver('alice.rsk', addr);

    const actualResolver = await registry.resolver(namehash('alice.rsk'));
    expect(actualResolver).toBe(addr);
  });

  it('should return a tx hash', async () => {
    const addr = '0x0000000000000000000000000000000001000006';

    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    const txHash = await rns.setResolver('alice.rsk', addr);

    expect(txHash).toBeTruthy();
  });

  it('should throw an error when address is invalid', async () => {
    await asyncExpectThrowRNSError(() => rns.setResolver('alice.rsk', 'invalidaddress'), INVALID_ADDRESS);
  });

  it('should throw an error when address has invalid checksum', async () => {
    await asyncExpectThrowRNSError(() => rns.setResolver('alice.rsk', '0x0000000000000000000000000000000001ABcdEF'), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when domain does not exists has invalid checksum', async () => {
    await asyncExpectThrowRNSError(() => rns.setResolver('noexists.rsk', '0x0000000000000000000000000000000001000006'), DOMAIN_NOT_EXISTS);
  });

  it('should VM revert when domain is not owned by the sender', async () => {
    const [account] = accounts;
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), account);

    await asyncExpectThrowVMRevert(() => rns.setResolver('alice.rsk', '0x0000000000000000000000000000000001000006'));
  });

  describe('custom tx options', () => {
    const addr = '0x0000000000000000000000000000000001000006';

    it('should send custom gasPrice', async () => {
      const gasPrice = '70000000';

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txHash = await rns.setResolver('alice.rsk', addr, { gasPrice });

      const tx = await web3.eth.getTransaction(txHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gas', async () => {
      const gas = 80000;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txHash = await rns.setResolver('alice.rsk', addr, { gas });

      const tx = await web3.eth.getTransaction(txHash);

      expect(tx.gas).toEqual(gas);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), from);

      const txHash = await rns.setResolver('alice.rsk', addr, { from });

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
])('%s - public nodes setResolver', (name, blockchainApiInstance) => {
  test('should fail when blockchain api instance does not contain accounts to sing the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.setResolver('multichain.testing.rsk', '0x0000000000000000000000000000000000000001'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
