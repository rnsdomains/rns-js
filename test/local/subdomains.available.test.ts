import { web3, defaultSender } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { deployRegistryAndCreateTldNode, getRNSInstance } from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - subdomains.available', (name, blockchainApiInstance) => {
  let registry: any;
  let rns: RNS;

  beforeEach(async () => {
    registry = await deployRegistryAndCreateTldNode();

    rns = getRNSInstance(blockchainApiInstance, registry);
  });

  describe('validations', () => {
    it('should not fail when sending a subdomain', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('subdomain'), defaultSender);
      const available = await rns.subdomains.available('subdomain.alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should not fail when sending just a tld', async () => {
      const available = await rns.subdomains.available('rsk', 'alice');
      expect(available).toBe(true);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('noexists.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });
  });

  describe('subdomains.available happy paths', () => {
    it('should return true if label is available', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should return false if label is not available', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('test'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'test');
      expect(available).toBe(false);
    });
  });
});
