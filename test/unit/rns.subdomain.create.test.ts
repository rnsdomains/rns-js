import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { asyncExpectThrowError } from '../utils';
import {
  INVALID_DOMAIN, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS,
  DOMAIN_NOT_EXISTS, INVALID_LABEL,
} from '../../src/errors';

const { expectRevert } = require('@openzeppelin/test-helpers');

describe('subdomains.create', () => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;
  const [owner] = accounts;

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
      await rns.subdomains.create('subdomain.alice.rsk', 'check', owner);
    });

    it('should not fail when sending just a tld if the sender is the owner of the tld', async () => {
      await rns.subdomains.create('rsk', 'alice', owner);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('.', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('domain.notrsk', 'willfail', owner), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('DOMAIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('DOM-AIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('noexist.rsk', 'willfail', owner), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('domain.rsk', '', owner), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('domain.rsk', 'iNVAlid', owner), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowError(async () => rns.subdomains.create('domain.rsk', 'iNVA-lid', owner), INVALID_LABEL);
    });
  });

  it('should create a subdomain if is available', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), web3.utils.sha3('alice'), defaultSender);

    let isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(true);

    await rns.subdomains.create('alice.rsk', 'test', owner);
    isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(false);
  });

  it('should create a subdomain even if is not available', async () => {
    const [anotherOwner] = accounts;
    await registry.setSubnodeOwner(namehash('rsk'), web3.utils.sha3('alice'), defaultSender);

    let isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(true);

    await rns.subdomains.create('alice.rsk', 'test', owner);
    isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(false);

    // create it again
    await rns.subdomains.create('alice.rsk', 'test', anotherOwner);
    isAvailable = await rns.subdomains.available('alice.rsk', 'test');
    expect(isAvailable).toBe(false);
  });

  it('should revert if creating a subdomain under a domain that the current address does not own', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), web3.utils.sha3('alice'), owner);

    expectRevert(rns.subdomains.create('alice.rsk', 'test', owner));
  });
});
