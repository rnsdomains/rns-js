import { web3, defaultSender } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { formatsByCoinType } from '@ensdomains/address-encoder';
import { NO_CHAIN_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { ChainId } from '../../src/types';
import { labelhash, toChecksumAddress } from '../../src/utils';
import {
  expectNoResolverError, deployDefinitiveResolver, deployRegistryAndCreateTldNode,
  getRNSInstance, deployPublicResolver, deployMultichainResolver, deployNameResolver,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - chainAddr resolution', (name, blockchainApiInstance) => {
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

    it('should resolve a name for BTC', async () => {
      const btcAddress = '1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG';

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.BTC, btcAddress);

      const addr = await rns.addr('alice.rsk', ChainId.BTC);
      expect(addr).toBe(btcAddress);
    });

    it('should resolve a name for ETH', async () => {
      const ethAddress = '0x0000000000000000000000000000000000000001';

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await multichainResolver.setChainAddr(namehash('alice.rsk'), ChainId.ETH, ethAddress);

      const addr = await rns.addr('alice.rsk', ChainId.ETH);
      expect(addr).toBe(toChecksumAddress(ethAddress));
    });

    it('should throw an error when resolver has not been set', async () => {
      await expectNoResolverError(registry, () => rns.addr('noresolver.rsk', ChainId.BTC));
    });

    it('should throw an error when resolver does not support chainAddr interface', async () => {
      // the address is the NameResolver contract, an ERC165 that not supports chainAddr interface
      const nameResolver = await deployNameResolver(registry);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
      await asyncExpectThrowRNSError(() => rns.addr('anothererc165.rsk', ChainId.BTC), NO_CHAIN_ADDR_RESOLUTION);
    });

    it('should throw an error when no resolution set', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolution'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk', ChainId.BTC), NO_CHAIN_ADDR_RESOLUTION_SET);
    });

    it('should throw an error when domain do not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.addr('noexists.rsk', ChainId.BTC), NO_RESOLVER);
    });
  });

  describe('definitive resolver', () => {
    let proxy: any;
    let coinType: number;
    beforeEach(async () => {
      ({ proxy, registry } = await deployDefinitiveResolver());

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should resolve a name for BTC', async () => {
      coinType = 0;
      const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const decoded = formatsByCoinType[coinType].decoder(btcAddress);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await proxy.methods['setAddr(bytes32,uint256,bytes)'](namehash('alice.rsk'), coinType, decoded, { from: defaultSender });

      const addr = await rns.addr('alice.rsk', ChainId.BTC);
      expect(addr).toBe(btcAddress);
    });

    it('should resolve a name for ETH', async () => {
      coinType = 60;
      const ethAddress = '0x0000000000000000000000000000000000000001';
      const decoded = formatsByCoinType[coinType].decoder(ethAddress);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await proxy.methods['setAddr(bytes32,uint256,bytes)'](namehash('alice.rsk'), coinType, decoded, { from: defaultSender });

      const addr = await rns.addr('alice.rsk', ChainId.ETH);
      expect(addr).toBe(ethAddress);
    });

    it('should throw an error when no resolution set', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolution'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk', ChainId.BTC), NO_CHAIN_ADDR_RESOLUTION_SET);
    });
  });
});
