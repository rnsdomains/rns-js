import { web3, defaultSender, accounts } from '@openzeppelin/test-environment';
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
import {
  deployDefinitiveResolver, deployRegistryAndCreateTldNode, getRNSInstance,
  deployPublicResolver, deployMultichainResolver,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setAddr', (name, blockchainApiInstance) => {
  const addr = '0x0000000000000000000000000000000001000006';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;

  describe('public and multichain resolvers', () => {
    beforeEach(async () => {
      registry = await deployRegistryAndCreateTldNode();

      publicResolver = await deployPublicResolver(registry);

      await registry.setResolver(namehash('rsk'), publicResolver.address);

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should set an address with public resolver', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', addr);

      let actualAddr = await rns.addr('alice.rsk');
      expect(actualAddr).toBe(addr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS);

      actualAddr = await publicResolver.addr(namehash('alice.rsk'));
      expect(actualAddr).toEqual(ZERO_ADDRESS);
    });

    it('should set an address if implements the multichain resolver', async () => {
      const multichainResolver = await deployMultichainResolver(registry, publicResolver);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await registry.setResolver(namehash('alice.rsk'), multichainResolver.address);

      await rns.setAddr('alice.rsk', addr);

      let actualAddr = await rns.addr('alice.rsk');
      expect(actualAddr).toBe(addr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS);

      actualAddr = await multichainResolver.addr(namehash('alice.rsk'));
      expect(actualAddr).toEqual(ZERO_ADDRESS);
    });

    it('should return a tx receipt when setting an address', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

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

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

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
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolver'), defaultSender);
      await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

      await asyncExpectThrowRNSError(() => rns.setAddr('noresolver.rsk', addr), NO_RESOLVER);
    });

    it('should throw an error when domain do not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', addr), NO_RESOLVER);
    });

    describe('custom tx options', () => {
      it('should send custom gasPrice', async () => {
        const gasPrice = '70000000';

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

        const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gasPrice });

        const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

        expect(tx.gasPrice).toEqual(gasPrice.toString());
      });

      it('should send custom gas', async () => {
        const gas = 80000;

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

        const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { gas });

        const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

        expect(tx.gas).toEqual(gas);
        expect(tx.from).toEqual(defaultSender);
      });

      it('should send custom sender', async () => {
        const [from] = accounts;

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), from);

        const txReceipt = await rns.setAddr('alice.rsk', addr, undefined, { from });

        const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

        expect(tx.from).toEqual(from);
      });
    });
  });

  describe('definitive resolver', () => {
    let proxy: any;
    beforeEach(async () => {
      ({ registry, proxy } = await deployDefinitiveResolver());

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should set an address with definitive resolver', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', addr);

      let actualAddr = await rns.addr('alice.rsk');
      expect(actualAddr).toBe(addr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS);

      actualAddr = await proxy.methods['addr(bytes32)'].call(namehash('alice.rsk'));
      expect(actualAddr).toEqual(ZERO_ADDRESS);
    });
  });
});

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - public nodes setAddr', (name, blockchainApiInstance) => {
  test('should fail when blockchain api instance does not contain accounts to sign the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
