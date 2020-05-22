import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import { contract, web3, accounts } from '@openzeppelin/test-environment';
import Web3 from 'web3';
import { hash as namehash } from 'eth-ens-namehash';
import { keccak256 } from 'js-sha3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { Options, NetworkId } from '../../src/types';
import { ADDR_INTERFACE } from '../../src/constants';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - rns.utils', (name, blockchainApiInstance) => {
  let registry: any;
  let rns: RNS;
  let options: Options;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

    registry = await Registry.new();

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  describe('.validDomain', () => {
    it('should return true for valid simple domain', () => {
      const domain = 'test.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(true);
    });

    it('should return true for valid domain with numbers', () => {
      const domain = 'test123.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(true);
    });


    it('should return true for valid pure numbers domain', () => {
      const domain = '1234.5678';
      expect(rns.utils.isValidDomain(domain)).toBe(true);
    });

    it('should return true for valid mulptiple label domain', () => {
      const domain = 'test.domain.is.valid';
      expect(rns.utils.isValidDomain(domain)).toBe(true);
    });

    it('should return false for upper case domain', () => {
      const domain = 'INVALID.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with -', () => {
      const domain = 'invalid-.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with _', () => {
      const domain = 'invalid_.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with &', () => {
      const domain = 'invalid&.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with /', () => {
      const domain = 'invalid/.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with \\', () => {
      const domain = 'invalid\\.domain';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for domain with other special characters', () => {
      const domain = '!"·$@#%^*()=+{}[]|:;';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for mixed case domain', () => {
      const domain = 'iNValiD.DomAIn';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for empty domain', () => {
      const domain = '';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });

    it('should return false for only dot domain', () => {
      const domain = '.';
      expect(rns.utils.isValidDomain(domain)).toBe(false);
    });
  });

  describe('.validLabel', () => {
    it('should return true for valid label', () => {
      const label = 'isvalid';
      expect(rns.utils.isValidLabel(label)).toBe(true);
    });

    it('should return true for label with numbers', () => {
      const label = 'isvalid123';
      expect(rns.utils.isValidLabel(label)).toBe(true);
    });

    it('should return true for pure number label', () => {
      const label = '1234567';
      expect(rns.utils.isValidLabel(label)).toBe(true);
    });

    it('should return false for upper case label', () => {
      const label = 'INVALID';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for mixed case label', () => {
      const label = 'iNValiD';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for empty label', () => {
      const label = '';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with -', () => {
      const label = 'invalid-.domain';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with _', () => {
      const label = 'invalid_';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with &', () => {
      const label = 'invalid&';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with /', () => {
      const label = 'invalid/';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with \\', () => {
      const label = 'invalid\\';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for label with other special characters', () => {
      const label = '!"·$@#%^*()=+{}[]|:;';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });

    it('should return false for only dot label', () => {
      const label = '.';
      expect(rns.utils.isValidLabel(label)).toBe(false);
    });
  });

  describe('.validTld', () => {
    it('should return true for rsk', () => {
      const tld = 'rsk';
      expect(rns.utils.isValidLabel(tld)).toBe(true);
    });

    it('should return false for other tlds', () => {
      const tld = 'notvalid';
      expect(rns.utils.isValidLabel(tld)).toBe(true);
    });
  });

  describe('.namehash', () => {
    it('should return namehash implementation of the given domain', () => {
      const domain = 'test.domain';
      expect(rns.utils.namehash(domain)).toEqual(namehash(domain));
    });
  });

  describe('.labelhash', () => {
    it('should return keccak256 implementation of the given label', () => {
      const label = 'test';
      expect(rns.utils.labelhash(label)).toEqual(`0x${keccak256(label)}`);
    });
  });

  describe('.hasAccounts', () => {
    it('should return true when sending web3 instance pointing to OpenZeppelin test enviroment blockchain', async () => {
      expect(await rns.utils.hasAccounts(blockchainApiInstance)).toEqual(true);
    });

    it('should return false when sending web3 instance instantiated with testnet', async () => {
      expect(await rns.utils.hasAccounts(new Web3('https://public-node.testnet.rsk.co'))).toEqual(false);
    });
  });

  describe('.hasMethod', () => {
    it('should return false when sending an account address', async () => {
      const [anAccount] = accounts;

      expect(
        await rns.utils.hasMethod(blockchainApiInstance, anAccount, ADDR_INTERFACE),
      ).toEqual(false);
    });

    it('should return false when sending the registry contract that does not support the addr interface', async () => {
      const hasMethod = await rns.utils.hasMethod(
        blockchainApiInstance,
        registry.address,
        ADDR_INTERFACE,
      );
      expect(hasMethod).toEqual(false);
    });

    it('should return true when sending the publicResolver contract that supports the addr interface', async () => {
      const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
      const publicResolver = await PublicResolver.new(registry.address);

      const hasMethod = await rns.utils.hasMethod(
        blockchainApiInstance, publicResolver.address, ADDR_INTERFACE,
      );
      expect(hasMethod).toEqual(true);
    });
  });

  describe('.isValidAddress', () => {
    it('should return false when sending an invalid address', async () => {
      expect(rns.utils.isValidAddress('invalid')).toEqual(false);
    });

    it('should return true when sending a valid address', async () => {
      expect(rns.utils.isValidAddress('0x0000000000000000000000000000000000000001')).toEqual(true);
    });

    it('should return true even if the checksum is invalid for both RSK networks', async () => {
      expect(rns.utils.isValidAddress('0x000000000000000000000000000000000000ABc1')).toEqual(true);
    });
  });

  describe('.isValidChecksumAddress', () => {
    describe('rsk mainnet', () => {
      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.isValidChecksumAddress('invalid', NetworkId.RSK_MAINNET)).toEqual(false);
      });

      it('should return true when sending a lowercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789abcdef', NetworkId.RSK_MAINNET)).toEqual(true);
      });

      it('should return false when sending an uppercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789ABCDEF', NetworkId.RSK_MAINNET)).toEqual(false);
      });

      it('should return true when sending an RSK address with a valid checksum for mainnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53Bf4d5cF81F8c52644912cfaE4d0E3EA7FAdD5b', NetworkId.RSK_MAINNET)).toEqual(true);
      });

      it('should return false when sending a valid address with a valid checksum for testnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53bf4d5cf81F8C52644912CFAe4d0E3ea7fAdd5b', NetworkId.RSK_MAINNET)).toEqual(false);
      });
    });

    describe('rsk testnet', () => {
      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.isValidChecksumAddress('invalid', NetworkId.RSK_TESTNET)).toEqual(false);
      });

      it('should return true when sending a lowercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789abcdef', NetworkId.RSK_TESTNET)).toEqual(true);
      });

      it('should return false when sending an uppercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789ABCDEF', NetworkId.RSK_TESTNET)).toEqual(false);
      });

      it('should return false when sending an RSK address with a valid checksum for mainnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53Bf4d5cF81F8c52644912cfaE4d0E3EA7FAdD5b', NetworkId.RSK_TESTNET)).toEqual(false);
      });

      it('should return true when sending a valid address with a valid checksum for testnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53bf4d5cf81F8C52644912CFAe4d0E3ea7fAdd5b', NetworkId.RSK_TESTNET)).toEqual(true);
      });
    });

    describe('other EVM network should work as it is Ethereum', () => {
      const otherNetworkId = 145245;
      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.isValidChecksumAddress('invalid', otherNetworkId)).toEqual(false);
      });

      it('should return true when sending a lowercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789abcdef', otherNetworkId)).toEqual(true);
      });

      it('should return false when sending an uppercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789ABCDEF', otherNetworkId)).toEqual(false);
      });

      it('should return true when sending an ethereum address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B', otherNetworkId)).toEqual(true);
      });

      it('should return false when sending a valid address with a valid checksum for rsk testnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53bf4d5cf81F8C52644912CFAe4d0E3ea7fAdd5b', otherNetworkId)).toEqual(false);
      });
    });

    describe('no networkId parameter should work as it is Ethereum', () => {
      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.isValidChecksumAddress('invalid')).toEqual(false);
      });

      it('should return true when sending a lowercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789abcdef')).toEqual(true);
      });

      it('should return false when sending an uppercase formatted address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x0000000000000000000000000123456789ABCDEF')).toEqual(false);
      });

      it('should return true when sending an ethereum address', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B')).toEqual(true);
      });

      it('should return false when sending a valid address with a valid checksum for rsk testnet', async () => {
        expect(rns.utils.isValidChecksumAddress('0x53bf4d5cf81F8C52644912CFAe4d0E3ea7fAdd5b')).toEqual(false);
      });
    });
  });

  describe('.toChecksumAddress', () => {
    describe('rsk mainnet', () => {
      const checksummed = '0x53Bf4d5cF81F8c52644912cfaE4d0E3EA7FAdD5b'; // rsk mainnet valid checksum

      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.toChecksumAddress('invalid', NetworkId.RSK_MAINNET)).toEqual(false);
      });

      it('should return checksummed address when sending a lowercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toLowerCase(),
          NetworkId.RSK_MAINNET,
        )).toEqual(checksummed);
      });

      it('should return checksummed address when sending an uppercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toUpperCase().replace('0X', '0x'),
          NetworkId.RSK_MAINNET,
        )).toEqual(checksummed);
      });

      it('should return same address when sending an already checksummed address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed,
          NetworkId.RSK_MAINNET,
        )).toEqual(checksummed);
      });
    });

    describe('rsk testnet', () => {
      const checksummed = '0x53bf4d5cf81F8C52644912CFAe4d0E3ea7fAdd5b'; // rsk testnet valid checksum

      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.toChecksumAddress('invalid', NetworkId.RSK_TESTNET)).toEqual(false);
      });

      it('should return checksummed address when sending a lowercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toLowerCase(),
          NetworkId.RSK_TESTNET,
        )).toEqual(checksummed);
      });

      it('should return checksummed address when sending an uppercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toUpperCase().replace('0X', '0x'),
          NetworkId.RSK_TESTNET,
        )).toEqual(checksummed);
      });

      it('should return same address when sending an already checksummed address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed,
          NetworkId.RSK_TESTNET,
        )).toEqual(checksummed);
      });
    });

    describe('other EVM network should work as it is Ethereum', () => {
      const checksummed = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // ethereum valid checksum
      const otherNetworkId = 145245;

      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.toChecksumAddress('invalid', otherNetworkId)).toEqual(false);
      });

      it('should return checksummed address when sending a lowercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toLowerCase(),
          otherNetworkId,
        )).toEqual(checksummed);
      });

      it('should return checksummed address when sending an uppercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toUpperCase().replace('0X', '0x'),
          otherNetworkId,
        )).toEqual(checksummed);
      });

      it('should return same address when sending an already checksummed address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed,
          otherNetworkId,
        )).toEqual(checksummed);
      });
    });

    describe('no networkId paramenter should work as it is Ethereum', () => {
      const checksummed = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // ethereum valid checksum

      it('should return false when sending an invalid address', async () => {
        expect(rns.utils.toChecksumAddress('invalid')).toEqual(false);
      });

      it('should return checksummed address when sending a lowercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(checksummed.toLowerCase())).toEqual(checksummed);
      });

      it('should return checksummed address when sending an uppercase formatted address', async () => {
        expect(rns.utils.toChecksumAddress(
          checksummed.toUpperCase().replace('0X', '0x'),
        )).toEqual(checksummed);
      });

      it('should return same address when sending an already checksummed address', async () => {
        expect(rns.utils.toChecksumAddress(checksummed)).toEqual(checksummed);
      });
    });
  });
});
