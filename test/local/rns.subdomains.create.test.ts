import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { asyncExpectThrowRNSError, asyncExpectThrowVMRevert } from '../utils';
import {
  INVALID_DOMAIN, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS,
  DOMAIN_NOT_EXISTS, INVALID_LABEL, SUBDOMAIN_NOT_AVAILABLE,
} from '../../src/errors';
import { labelhash } from '../../src/utils';
import { ZERO_ADDRESS } from '../../src/constants';

describe('subdomains.create', () => {
  const TLD = 'rsk';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;
  const [owner] = accounts;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    await registry.setResolver(namehash(TLD), publicResolver.address);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  describe('validations', () => {
    it('should not fail when sending a subdomain', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('subdomain'), defaultSender);
      await rns.subdomains.create('subdomain.alice.rsk', 'check', owner);
    });

    it('should not fail when sending just a tld if the sender is the owner of the tld', async () => {
      await rns.subdomains.create('rsk', 'alice', owner);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('.', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('domain.notrsk', 'willfail', owner), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('DOMAIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('DOM-AIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('noexist.rsk', 'willfail', owner), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('domain.rsk', '', owner), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('domain.rsk', 'iNVAlid', owner), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('domain.rsk', 'iNVA-lid', owner), INVALID_LABEL);
    });

    it('should revert if creating a subdomain under a domain that the current address does not own', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), owner);

      await asyncExpectThrowVMRevert(async () => rns.subdomains.create('alice.rsk', 'test', owner));
    });

    it('should not create a subdomain if is not available', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await rns.subdomains.create('alice.rsk', 'test', owner);

      // create it again should fail
      await asyncExpectThrowRNSError(async () => rns.subdomains.create('alice.rsk', 'test', owner), SUBDOMAIN_NOT_AVAILABLE);
    });
  });

  describe('happy paths', () => {
    const addr = '0x0000000000000000000000000000000001000006';
    let expectedAddr: string; let
      expectedOwner: string;

    beforeEach(async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
    });

    it('no owner and no addr provided', async () => {
      await rns.subdomains.create('alice.rsk', 'test');

      expectedOwner = defaultSender;
      expectedAddr = ZERO_ADDRESS;
    });

    it('owner provided, no addr', async () => {
      await rns.subdomains.create('alice.rsk', 'test', owner);

      expectedOwner = owner;
      expectedAddr = ZERO_ADDRESS;
    });

    it('owner and addr provided, owner equals sender', async () => {
      await rns.subdomains.create('alice.rsk', 'test', defaultSender, addr);

      expectedOwner = defaultSender;
      expectedAddr = addr;
    });

    it('owner and addr provided, owner is not the sender', async () => {
      await rns.subdomains.create('alice.rsk', 'test', owner, addr);

      expectedOwner = owner;
      expectedAddr = addr;
    });

    it('owner empty and addr provided', async () => {
      await rns.subdomains.create('alice.rsk', 'test', '', addr);

      expectedOwner = defaultSender;
      expectedAddr = addr;
    });

    afterEach(async () => {
      const actualOwner = await registry.owner(namehash('test.alice.rsk'));
      expect(actualOwner).toEqual(expectedOwner);

      const actualAddr = await publicResolver.addr(namehash('test.alice.rsk'));
      expect(actualAddr).toEqual(expectedAddr);

      expectedAddr = '';
      expectedOwner = '';
    });
  });
});