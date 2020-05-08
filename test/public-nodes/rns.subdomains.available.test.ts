import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';

describe.each([
  new Web3(PUBLIC_NODE_MAINNET),
  new Web3(PUBLIC_NODE_TESTNET),
  new Rsk3(PUBLIC_NODE_MAINNET),
  new Rsk3(PUBLIC_NODE_TESTNET),
])('rns.subdomains.available', (blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  describe('validations', () => {
    test('should not fail when sending a subdomain', async () => {
      const available = await rns.subdomains.available('multichain.testing.rsk', 'check');
      expect(available).toBe(true);
    });

    test('should not fail when sending just a tld', async () => {
      const available = await rns.subdomains.available('rsk', 'testing');
      expect(available).toBe(false);
    });

    test('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });

    test('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });

    test('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    test('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    test('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    test('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('noexists.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });

    test('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });

    test('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });

    test('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });
  });

  describe('happy paths', () => {
    test('should return false if label is not available', async () => {
      const available = await rns.subdomains.available('testing.rsk', 'multichain');
      expect(available).toBe(false);
    });

    test('should return true if label is available', async () => {
      const available = await rns.subdomains.available('testing.rsk', 'available');
      expect(available).toBe(true);
    });
  });
});
