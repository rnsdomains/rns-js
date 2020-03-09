import Web3 from 'web3';
import RNS from '../../src/index';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe('subdomains.available validations', () => {
  describe('should not fail when sending a subdomain', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('multichain.testing.rsk', 'check');
      expect(available).toBe(true);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('multichain.testing.rsk', 'check');
      expect(available).toBe(true);
    });
  });

  describe('should not fail when sending just a tld', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('rsk', 'testing');
      expect(available).toBe(false);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('rsk', 'testing');
      expect(available).toBe(false);
    });
  });

  describe('should fail when sending an empty domain', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('', 'willfail'), INVALID_DOMAIN);
    });
  });

  describe('should fail when sending an just a dot with no labels', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('.', 'willfail'), INVALID_DOMAIN);
    });
  });

  describe('should fail when not sending an .rsk domain', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.notrsk', 'willfail'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });
  });

  describe('should fail when sending upper case domain', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('DOMAIN.rsk', 'willfail'), INVALID_DOMAIN);
    });
  });

  describe('should fail when sending invalid characters', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('DOM-AIN.rsk', 'willfail'), INVALID_DOMAIN);
    });
  });

  describe('should fail when given domain does not exist', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('noexist.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('noexist.rsk', 'willfail'), DOMAIN_NOT_EXISTS);
    });
  });

  describe('should fail when sending empty label', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', ''), INVALID_LABEL);
    });
  });

  describe('should fail when sending label with upper case characters', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', 'iNVAlid'), INVALID_LABEL);
    });
  });

  describe('should fail when sending label with invalid characters', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(async () => rns.subdomains.available('domain.rsk', 'iNVA-lid'), INVALID_LABEL);
    });
  });
});

describe('subdomains.available happy paths', () => {
  describe('should return false if label is not available', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('testing.rsk', 'multichain');
      expect(available).toBe(false);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('testing.rsk', 'multichain');
      expect(available).toBe(false);
    });
  });

  describe('should return true if label is available', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('testing.rsk', 'available');
      expect(available).toBe(true);
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      const available = await rns.subdomains.available('testing.rsk', 'available');
      expect(available).toBe(true);
    });
  });
});