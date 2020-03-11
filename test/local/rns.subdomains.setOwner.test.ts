import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
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

describe('subdomains.setOwner', () => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;
  const [owner] = accounts;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

    registry = await Registry.new();

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

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
      await rns.subdomains.setOwner('subdomain.alice.rsk', 'check', owner);
    });

    it('should not fail when sending just a tld if the sender is the owner of the tld', async () => {
      await rns.subdomains.setOwner('rsk', 'alice', owner);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('.', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('domain.notrsk', 'willfail', owner), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('DOMAIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('DOM-AIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('noexist.rsk', 'willfail', owner), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('domain.rsk', '', owner), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('domain.rsk', 'iNVAlid', owner), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('domain.rsk', 'iNVA-lid', owner), INVALID_LABEL);
    });
  });

  it('should create a subdomain if is available', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    let isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(true);

    await rns.subdomains.setOwner('alice.rsk', 'test', owner);
    isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(false);
  });

  it('should not create a subdomain if is not available', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
    await rns.subdomains.setOwner('alice.rsk', 'test', owner);

    // create it again should fail
    await asyncExpectThrowRNSError(async () => rns.subdomains.setOwner('alice.rsk', 'test', owner), SUBDOMAIN_NOT_AVAILABLE);
  });

  it('should revert if creating a subdomain under a domain that the current address does not own', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), owner);

    await asyncExpectThrowVMRevert(async () => rns.subdomains.setOwner('alice.rsk', 'test', owner));
  });
});
