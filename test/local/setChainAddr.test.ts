import { web3, defaultSender, accounts } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { formatsByCoinType } from '@ensdomains/address-encoder';
import {
  NO_RESOLVER, NO_ACCOUNTS_TO_SIGN, INVALID_CHECKSUM_ADDRESS, INVALID_ADDRESS,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { ChainId } from '../../src/types';
import { labelhash } from '../../src/utils';
import {
  deployDefinitiveResolver, deployRegistryAndCreateTldNode,
  getRNSInstance, deployPublicResolver, deployMultichainResolver,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setChainAddr', (name, blockchainApiInstance) => {
  const rskAddr = '0x0000000000000000000000000000000001000006';
  const ethAddr = '0x0000000000000000000000000000000012345678';
  const btcAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

  let registry: any;
  let multichainResolver: any;
  let rns: RNS;

  describe('public and multichain resolver', () => {
    beforeEach(async () => {
      registry = await deployRegistryAndCreateTldNode();

      const publicResolver = await deployPublicResolver(registry);
      multichainResolver = await deployMultichainResolver(registry, publicResolver);

      await registry.setResolver(namehash('rsk'), multichainResolver.address);

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should set an address for RSK', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

      let actualAddr = await rns.addr('alice.rsk', ChainId.RSK);
      expect(actualAddr).toBe(rskAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS, ChainId.RSK);

      actualAddr = await multichainResolver.chainAddr(namehash('alice.rsk'), ChainId.RSK);
      expect(actualAddr).toEqual(ZERO_ADDRESS);
    });

    it('should set an address for ETH', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', ethAddr, ChainId.ETH);

      let actualAddr = await rns.addr('alice.rsk', ChainId.ETH);
      expect(actualAddr).toBe(ethAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS, ChainId.ETH);

      actualAddr = await multichainResolver.chainAddr(namehash('alice.rsk'), ChainId.ETH);
      expect(actualAddr).toEqual(ZERO_ADDRESS);
    });

    it('should set an address for BTC', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', btcAddr, ChainId.BTC);

      let actualAddr = await rns.addr('alice.rsk', ChainId.BTC);
      expect(actualAddr).toBe(btcAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', '', ChainId.BTC);

      actualAddr = await multichainResolver.chainAddr(namehash('alice.rsk'), ChainId.BTC);
      expect(actualAddr).toEqual('');
    });

    it('should return a tx receipt when setting an address', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txHash = await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

      expect(txHash).toBeTruthy();
    });

    it('should throw an error when invalid checksum for RSK', async () => {
      const address = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // valid for ethereum

      await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', address, ChainId.RSK), INVALID_CHECKSUM_ADDRESS);
    });

    it('should throw an error when invalid checksum for Ethereum', async () => {
      const address = '0x53Bf4d5cF81F8c52644912cfaE4d0E3EA7FAdD5b'; // valid for rsk mainnet

      await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', address, ChainId.ETH), INVALID_CHECKSUM_ADDRESS);
    });

    it('should throw an error when resolver has not been set', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolver'), defaultSender);
      await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

      await asyncExpectThrowRNSError(() => rns.setAddr('noresolver.rsk', rskAddr, ChainId.RSK), NO_RESOLVER);
    });

    it('should throw an error when domain do not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.setAddr('noexists.rsk', rskAddr), NO_RESOLVER);
    });

    describe('custom tx options', () => {
      it('should send custom gasPrice', async () => {
        const gasPrice = '70000000';

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

        const txHash = await rns.setAddr('alice.rsk', btcAddr, ChainId.BTC, { gasPrice });

        const tx = await web3.eth.getTransaction(txHash);

        expect(tx.gasPrice).toEqual(gasPrice.toString());
      });

      it('should send custom gas', async () => {
        const gas = 800000;

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

        const txHash = await rns.setAddr('alice.rsk', ethAddr, ChainId.ETH, { gas });

        const tx = await web3.eth.getTransaction(txHash);

        expect(tx.gas).toEqual(gas);
        expect(tx.from).toEqual(defaultSender);
      });

      it('should send custom sender', async () => {
        const [from] = accounts;

        await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), from);

        const txHash = await rns.setAddr('alice.rsk', ethAddr, ChainId.ETH, { from });

        const tx = await web3.eth.getTransaction(txHash);

        expect(tx.from).toEqual(from);
      });
    });
  });

  describe('definitive resolver', () => {
    let proxy: any;
    let coinType: number;

    const getAddress = async (coin: number) => {
      const decodedAddr = await proxy.methods['addr(bytes32,uint256)'](
        namehash('alice.rsk'),
        coin,
      );

      if (decodedAddr) {
        const buff = Buffer.from(decodedAddr.replace('0x', ''), 'hex');

        return formatsByCoinType[coin].encoder(buff);
      }

      return decodedAddr;
    };

    beforeEach(async () => {
      ({ registry, proxy } = await deployDefinitiveResolver());

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should throw an error if invalid address', async () => {
      coinType = 0;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.setAddr('alice.rsk', 'invalid', ChainId.BTC), INVALID_ADDRESS);
    });

    it('should set an address for RSK', async () => {
      coinType = 137;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', rskAddr, ChainId.RSK);

      let actualAddr = await getAddress(coinType);

      expect(actualAddr).toBe(rskAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS, ChainId.RSK);

      actualAddr = await getAddress(coinType);
      expect(actualAddr).toBe(ZERO_ADDRESS);
    });

    it('should set an address for ETH', async () => {
      coinType = 60;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', ethAddr, ChainId.ETH);

      let actualAddr = await getAddress(coinType);

      expect(actualAddr).toBe(ethAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS, ChainId.ETH);

      actualAddr = await getAddress(coinType);
      expect(actualAddr).toBe(ZERO_ADDRESS);
    });

    it('should set an address for ETC', async () => {
      coinType = 61;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', ethAddr, ChainId.ETC);

      let actualAddr = await getAddress(coinType);

      expect(actualAddr).toBe(ethAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', ZERO_ADDRESS, ChainId.ETC);

      actualAddr = await getAddress(coinType);
      expect(actualAddr).toBe(ZERO_ADDRESS);
    });

    it('should set an address for BTC', async () => {
      coinType = 0;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', btcAddr, ChainId.BTC);

      let actualAddr = await getAddress(coinType);

      expect(actualAddr).toBe(btcAddr);

      // set it back to zero
      await rns.setAddr('alice.rsk', '', ChainId.BTC);

      actualAddr = await getAddress(coinType);
      expect(actualAddr).toBe(null);
    });

    it('should set an address for MONA', async () => {
      coinType = 22;
      const monaAddress = 'PFzo1x18LcHYkeWNp8pDtsA7WJYaAbhAcp';

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await rns.setAddr('alice.rsk', monaAddress, ChainId.MONA);

      let actualAddr = await getAddress(coinType);

      expect(actualAddr).toBe(monaAddress);

      // set it back to zero
      await rns.setAddr('alice.rsk', '', ChainId.MONA);

      actualAddr = await getAddress(coinType);
      expect(actualAddr).toBe(null);
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
      () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001', ChainId.ETH),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
