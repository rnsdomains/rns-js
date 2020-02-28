import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';

describe('subdomains.available', () => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

    registry = await Registry.new();

    await registry.setSubnodeOwner('0x00', web3.utils.sha3(TLD), defaultSender);

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  describe('validations', () => {
    it('should not fail when sending a subdomain', async () => {
      await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), web3.utils.sha3('subdomain'), defaultSender);
      const available = await rns.subdomains.available('subdomain.alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should not fail when sending just a tld', async () => {
      const available = await rns.subdomains.available('rsk', 'alice');
      expect(available).toBe(true);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('noexist.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });
  });

  describe('subdomains.available happy paths', () => {
    it('should return true if label is available', async () => {
      await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('alice'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'check');
      expect(available).toBe(true);
    });

    it('should return false if label is not available', async () => {
      await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), web3.utils.sha3('test'), defaultSender);
      const available = await rns.subdomains.available('alice.rsk', 'test');
      expect(available).toBe(false);
    });
  });
});
