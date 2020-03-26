import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL,
  NO_AVAILABLE_METHOD, NO_TLD_OWNER,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';
import { ZERO_ADDRESS } from '../../src/constants';

describe('subdomains.available', () => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;

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
    it('should return false when sending a subdomain', async () => {
      const available = await rns.available('subdomain.alice.rsk');
      expect(available).toBe(false);
    });

    it('should fail when sending an empty string', async () => {
      await asyncExpectThrowRNSError(async () => rns.available(''), INVALID_LABEL);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('.'), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('domain.notrsk'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('DOMAIN.rsk'), INVALID_DOMAIN);
    });

    it('should fail when sending upper case label', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('DOMAIN'), INVALID_LABEL);
    });

    it('should fail when sending invalid characters for label', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('dom-ain'), INVALID_LABEL);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('dom-ain.rsk'), INVALID_DOMAIN);
    });

    it('should fail when tld does not implement available method', async () => {
      await asyncExpectThrowRNSError(async () => rns.available('domain.rsk'), NO_AVAILABLE_METHOD);
    });

    it('should fail when tld node does not have owner', async () => {
      await registry.setOwner(namehash(TLD), ZERO_ADDRESS);
      await asyncExpectThrowRNSError(async () => rns.available('domain.rsk'), NO_TLD_OWNER);
    });
  });
});
