import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - subdomains.available', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

    registry = await Registry.new();

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  describe('validations', () => {
    it('should not fail when sending a subdomain', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('subdomain'), defaultSender);
      const available = await rns.subdomains.available('subdomain.alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should not fail when sending just a tld', async () => {
      const available = await rns.subdomains.available('rsk', 'alice');
      expect(available).toBe(true);
    });

    it('should fail when sending an empty domain', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('noexists.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', () => {
      asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });
  });

  describe('subdomains.available happy paths', () => {
    it('should return true if label is available', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should return false if label is not available', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('test'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'test');
      expect(available).toBe(false);
    });
  });
});
