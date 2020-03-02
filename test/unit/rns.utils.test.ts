import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import { contract, web3, accounts } from '@openzeppelin/test-environment';
import Web3 from 'web3';
import { hash as namehash } from 'eth-ens-namehash';
import { keccak256 } from 'js-sha3';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { ERC165_INTERFACE } from '../../src/constants';

describe('rns.utils', () => {
  let registry: any;
  let rns: RNS;
  let options: Options;
  const web3Instance = web3 as unknown as Web3;
  
  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

    registry = await Registry.new();

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(web3Instance, options);
  });

  describe('.validDomain', () => {
    it('should return true for valid simple domain', () => {
      const domain = 'test.domain';
      expect(rns.utils.validDomain(domain)).toBe(true);
    });

    it('should return true for valid domain with numbers', () => {
      const domain = 'test123.domain';
      expect(rns.utils.validDomain(domain)).toBe(true);
    });


    it('should return true for valid pure numbers domain', () => {
      const domain = '1234.5678';
      expect(rns.utils.validDomain(domain)).toBe(true);
    });

    it('should return true for valid mulptiple label domain', () => {
      const domain = 'test.domain.is.valid';
      expect(rns.utils.validDomain(domain)).toBe(true);
    });

    it('should return false for upper case domain', () => {
      const domain = 'INVALID.DOMAIN';
      expect(rns.utils.validDomain(domain)).toBe(false);
    });

    it('should return false for mixed case domain', () => {
      const domain = 'iNValiD.DomAIn';
      expect(rns.utils.validDomain(domain)).toBe(false);
    });

    it('should return false for empty domain', () => {
      const domain = '';
      expect(rns.utils.validDomain(domain)).toBe(false);
    });

    it('should return false for only dot domain', () => {
      const domain = '.';
      expect(rns.utils.validDomain(domain)).toBe(false);
    });
  });

  describe('.validLabel', () => {
    it('should return true for valid label', () => {
      const label = 'isvalid';
      expect(rns.utils.validLabel(label)).toBe(true);
    });

    it('should return true for label with numbers', () => {
      const label = 'isvalid123';
      expect(rns.utils.validLabel(label)).toBe(true);
    });

    it('should return true for pure number label', () => {
      const label = '1234567';
      expect(rns.utils.validLabel(label)).toBe(true);
    });

    it('should return false for upper case label', () => {
      const label = 'INVALID';
      expect(rns.utils.validLabel(label)).toBe(false);
    });

    it('should return false for mixed case label', () => {
      const label = 'iNValiD';
      expect(rns.utils.validLabel(label)).toBe(false);
    });
    
    it('should return false for empty label', () => {
      const label = '';
      expect(rns.utils.validLabel(label)).toBe(false);
    });

    it('should return false for only dot label', () => {
      const label = '.';
      expect(rns.utils.validLabel(label)).toBe(false);
    });
  });

  describe('.validTld', () => {
    it('should return true for rsk', () => {
      const tld = 'rsk';
      expect(rns.utils.validLabel(tld)).toBe(true);
    });

    it('should return false for other tlds', () => {
      const tld = 'notvalid';
      expect(rns.utils.validLabel(tld)).toBe(true);
    });
  });

  describe('.namehash', () => {
    it('should return namehash implementation of the given domain', () => {
      const domain = 'test.domain';
      expect(rns.utils.namehash(domain)).toEqual(namehash(domain));
    });
  });

  describe('.sha3', () => {
    it('should return sha3 implementation of the given label', () => {
      const label = 'test';
      expect(rns.utils.sha3(label)).toEqual(keccak256(label));
    });
  });

  describe('.hasAccounts', () => {
    it('should return true when sending web3 instance pointing to OpenZeppelin test enviroment blockchain', async () => {
      expect(await rns.utils.hasAccounts(web3Instance)).toEqual(true);
    });

    it('should return false when sending web3 instance instantiated with testnet', async () => {
      expect(await rns.utils.hasAccounts(new Web3('https://public-node.testnet.rsk.co'))).toEqual(false);
    });
  });

  describe('.hasMethod', () => {
    it('should return false when sending an account address', async () => {
      const [anAccount] = accounts;
  
      expect(await rns.utils.hasMethod(web3Instance, anAccount, ERC165_INTERFACE)).toEqual(false);
    });

    it('should return false when sending the registry contract that does not support the ERC165 interface', async () => {
      expect(await rns.utils.hasMethod(web3Instance, registry.address, ERC165_INTERFACE)).toEqual(false);
    });

    it('should return true when sending the publicResolver contract that supports the ERC165 interface', async () => {
      const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
      const publicResolver = await PublicResolver.new(registry.address);

      expect(await rns.utils.hasMethod(web3Instance, publicResolver.address, ERC165_INTERFACE)).toEqual(true);
    });
  });
});
