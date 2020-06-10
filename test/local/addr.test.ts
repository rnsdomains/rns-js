import {
  accounts, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_ADDR_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import {
  expectNoResolverError, deployDefinitiveResolver, deployRegistryAndCreateTldNode,
  getRNSInstance, deployPublicResolver, deployNameResolver, deployMultichainResolver,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - addr resolution', (name, blockchainApiInstance) => {
  const [resolution] = accounts;

  let registry: any;
  let publicResolver: any;
  let rns: RNS;

  describe('public and multichain resolver', () => {
    beforeEach(async () => {
      registry = await deployRegistryAndCreateTldNode();
      publicResolver = await deployPublicResolver(registry);

      await registry.setResolver(namehash('rsk'), publicResolver.address);

      rns = getRNSInstance(blockchainApiInstance, registry);
    });

    it('should resolve a name with public resolver', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await publicResolver.setAddr(namehash('alice.rsk'), resolution);

      const addr = await rns.addr('alice.rsk');
      expect(addr).toBe(resolution);
    });

    it('should resolve an address with multichain resolver', async () => {
      const multichainResolver = await deployMultichainResolver(registry, publicResolver);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await registry.setResolver(namehash('alice.rsk'), multichainResolver.address);

      await multichainResolver.setAddr(namehash('alice.rsk'), resolution);

      const actualAddr = await rns.addr('alice.rsk');
      expect(actualAddr).toBe(resolution);
    });

    it('should throw an error when resolver has not been set', async () => {
      await expectNoResolverError(registry, () => rns.addr('noresolver.rsk'));
    });

    it('should throw an error when resolver does not support addr interface', async () => {
      // resolver address is the NameResolver contract, an ERC165 that not supports addr interface
      const nameResolver = await deployNameResolver(registry);

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('anothererc165'), defaultSender);
      await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
      await asyncExpectThrowRNSError(() => rns.addr('anothererc165.rsk'), NO_ADDR_RESOLUTION);
    });

    it('should throw an error when no resolution set', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolution'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk'), NO_ADDR_RESOLUTION_SET);
    });

    it('should throw an error when domain do not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.addr('noexists.rsk'), NO_RESOLVER);
    });
  });

  describe('definitive resolver', () => {
    let proxy: any;

    beforeEach(async () => {
      ({ proxy, registry } = await deployDefinitiveResolver());

      const options = {
        contractAddresses: {
          registry: registry.address,
        },
      };

      rns = new RNS(blockchainApiInstance, options);
    });

    it('should resolve a name', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      await proxy.methods['setAddr(bytes32,address)'](namehash('alice.rsk'), resolution.toLowerCase(), { from: defaultSender });

      const addr = await rns.addr('alice.rsk');
      expect(addr).toBe(resolution);
    });

    it('should throw an error when no resolution set', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolution'), defaultSender);

      await asyncExpectThrowRNSError(() => rns.addr('noresolution.rsk'), NO_ADDR_RESOLUTION_SET);
    });
  });
});
