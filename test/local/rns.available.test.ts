import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import ERC677Data from '@rsksmart/erc677/ERC677Data.json';
import TokenRegistrarData from '@rsksmart/rns-auction-registrar/TokenRegistrarData.json';
import RSKOwnerData from '@rsksmart/rns-rskregistrar/RSKOwnerData.json';
import BytesUtilsData from '@rsksmart/rns-rskregistrar/BytesUtilsData.json';
import NamePriceData from '@rsksmart/rns-rskregistrar/NamePriceData.json';
import FIFSRegistrarData from '@rsksmart/rns-rskregistrar/FIFSRegistrarData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import helpers from '@openzeppelin/test-helpers';
import {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL,
  NO_AVAILABLE_METHOD, NO_TLD_OWNER,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';
import { ZERO_ADDRESS } from '../../src/constants';

const web3Instance = web3 as unknown as Web3;
const rsk3 = new Rsk3(web3.currentProvider);

describe.each([
  web3Instance,
  rsk3,
])('subdomains.available', (provider) => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;

  describe('validations', () => {
    beforeEach(async () => {
      const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

      registry = await Registry.new();

      await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

      options = {
        contractAddresses: {
          registry: registry.address,
        },
      };

      rns = new RNS(provider, options);
    });

    it('should return false when sending a subdomain', async () => {
      const available = await rns.available('subdomain.alice.rsk');
      expect(available).toBe(false);
    });

    it('should fail when sending an empty string', async () => {
      await asyncExpectThrowRNSError(() => rns.available(''), INVALID_LABEL);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(() => rns.available('.'), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(() => rns.available('domain.notrsk'), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(() => rns.available('DOMAIN.rsk'), INVALID_DOMAIN);
    });

    it('should fail when sending upper case label', async () => {
      await asyncExpectThrowRNSError(() => rns.available('DOMAIN'), INVALID_LABEL);
    });

    it('should fail when sending invalid characters for label', async () => {
      await asyncExpectThrowRNSError(() => rns.available('dom-ain'), INVALID_LABEL);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.available('dom-ain.rsk'), INVALID_DOMAIN);
    });

    it('should fail when tld does not implement available method', async () => {
      await asyncExpectThrowRNSError(() => rns.available('domain.rsk'), NO_AVAILABLE_METHOD);
    });

    it('should fail when tld node does not have owner', async () => {
      await registry.setOwner(namehash(TLD), ZERO_ADDRESS);
      await asyncExpectThrowRNSError(() => rns.available('domain.rsk'), NO_TLD_OWNER);
    });
  });

  describe('happy paths', () => {
    let fifsRegistrar: any;
    let rif: any;

    const registerName = async (name: string) => {
      const secret = '0x0000000000000000000000000000000000000000000000000000000000001234';
      const duration = 1;
      const amount = web3.utils.toBN('2000000000000000000');
      const label = labelhash(name);

      await rif.approve(fifsRegistrar.address, amount);

      const commitment = await fifsRegistrar.makeCommitment(label, defaultSender, secret);
      await fifsRegistrar.commit(commitment);

      await helpers.time.increase(61);

      await fifsRegistrar.register(name, defaultSender, secret, duration);
    };

    beforeEach(async () => {
      const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
      const ERC677 = contract.fromABI(ERC677Data.abi, ERC677Data.bytecode);
      const TokenRegistrar = contract.fromABI(TokenRegistrarData.abi, TokenRegistrarData.bytecode);
      const RSKOwner = contract.fromABI(RSKOwnerData.abi, RSKOwnerData.bytecode);
      const BytesUtils = contract.fromABI(BytesUtilsData.abi, BytesUtilsData.bytecode);
      const NamePrice = contract.fromABI(NamePriceData.abi, NamePriceData.bytecode);
      const FIFSRegistrar = contract.fromABI(FIFSRegistrarData.abi, FIFSRegistrarData.bytecode);

      registry = await Registry.new();

      // rif token
      rif = await ERC677.new(
        defaultSender,
        web3.utils.toBN('100000000000000000000000'),
        'RIFOS',
        'RIF',
        web3.utils.toBN('18'),
      );
      await rif.transfer(defaultSender, web3.utils.toBN('50000000000000000000000'));

      // token registrar
      const tokenRegistrar = await TokenRegistrar.new(registry.address, namehash(TLD), rif.address);

      // rskOwner deployment
      const rskOwner = await RSKOwner.new(tokenRegistrar.address, registry.address, namehash(TLD));

      // give rsk ownership to rskOwner
      await registry.setSubnodeOwner('0x00', labelhash(TLD), rskOwner.address);

      const bytesUtils = await BytesUtils.new();

      const namePrice = await NamePrice.new();

      await FIFSRegistrar.detectNetwork();
      await FIFSRegistrar.link('BytesUtils', bytesUtils.address);

      fifsRegistrar = await FIFSRegistrar.new(
        rif.address,
        rskOwner.address,
        defaultSender,
        namePrice.address,
      );

      await rskOwner.addRegistrar(fifsRegistrar.address);

      options = {
        contractAddresses: {
          registry: registry.address,
        },
      };

      rns = new RNS(provider, options);
    });

    it('should return an empty array just rsk', async () => {
      const available = await rns.available('rsk');
      expect(available).toEqual([]);
    });

    it('should return an empty array when sending a label length < 5', async () => {
      const available = await rns.available('bob');
      expect(available).toEqual([]);
    });

    it('should return an array when sending a label length = 5', async () => {
      const available = await rns.available('alice');
      expect(available).toEqual(['alice.rsk']);
    });

    it('should return an array when sending a label length > 5', async () => {
      const available = await rns.available('robert');
      expect(available).toEqual(['robert.rsk']);
    });

    it('should return an empty array when sending an existant label', async () => {
      await registerName('alice');

      const available = await rns.available('alice');
      expect(available).toEqual([]);
    });

    it('should return false when sending a label length < 5', async () => {
      const available = await rns.available('bob.rsk');
      expect(available).toEqual(false);
    });

    it('should return true when sending a label length = 5', async () => {
      const available = await rns.available('alice.rsk');
      expect(available).toEqual(true);
    });

    it('should return true when sending a label length > 5', async () => {
      const available = await rns.available('robert.rsk');
      expect(available).toEqual(true);
    });

    it('should return false when sending a registered domain', async () => {
      await registerName('alice');

      const available = await rns.available('alice.rsk');
      expect(available).toEqual(false);
    });
  });
});
