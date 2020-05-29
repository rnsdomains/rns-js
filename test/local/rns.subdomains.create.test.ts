import Web3 from 'web3';
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Rsk3 from '@rsksmart/rsk3';
import { TransactionReceipt } from 'web3-eth';
import RNS from '../../src/index';
import { Options, NetworkId } from '../../src/types';
import {
  asyncExpectThrowRNSError, asyncExpectThrowVMRevert, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import {
  INVALID_DOMAIN, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS,
  DOMAIN_NOT_EXISTS, INVALID_LABEL, SUBDOMAIN_NOT_AVAILABLE, NO_ACCOUNTS_TO_SIGN,
  INVALID_CHECKSUM_ADDRESS, INVALID_ADDRESS,
} from '../../src/errors';
import { labelhash } from '../../src/utils';
import { ZERO_ADDRESS } from '../../src/constants';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - subdomains.create', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let publicResolver: any;
  let rns: RNS;
  let options: Options;
  const [owner] = accounts;

  beforeEach(async () => {
    const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
    const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);

    await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

    await registry.setResolver(namehash(TLD), publicResolver.address);

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
      await rns.subdomains.create('subdomain.alice.rsk', 'check', owner);
    });

    it('should not fail when sending just a tld if the sender is the owner of the tld', async () => {
      await rns.subdomains.create('rsk', 'alice', owner);
    });

    it('should fail when instating the lib with RSK networkId and owner address has an invalid checksum for RSK', async () => {
      options = {
        contractAddresses: {
          registry: registry.address,
        },
        networkId: NetworkId.RSK_MAINNET,
      };

      rns = new RNS(blockchainApiInstance, options);

      const invalid = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // valid for ethereum

      await asyncExpectThrowRNSError(() => rns.subdomains.create('alice.rsk', 'willfail', invalid), INVALID_CHECKSUM_ADDRESS);
    });

    it('should fail when instating the lib with RSK networkId and addr address has an invalid checksum for RSK', async () => {
      options = {
        contractAddresses: {
          registry: registry.address,
        },
        networkId: NetworkId.RSK_MAINNET,
      };

      rns = new RNS(blockchainApiInstance, options);

      const invalid = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // valid for ethereum

      await asyncExpectThrowRNSError(() => rns.subdomains.create('alice.rsk', 'willfail', owner, invalid), INVALID_CHECKSUM_ADDRESS);
    });

    it('should fail when invalid owner address', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('alice.rsk', 'willfail', 'invalid'), INVALID_ADDRESS);
    });

    it('should fail when invalid addr address', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('alice.rsk', 'willfail', owner, 'invalid'), INVALID_ADDRESS);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('.', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('domain.notrsk', 'willfail', owner), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('DOMAIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('DOM-AIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('noexists.rsk', 'willfail', owner), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('domain.rsk', '', owner), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('domain.rsk', 'iNVAlid', owner), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.create('domain.rsk', 'iNVA-lid', owner), INVALID_LABEL);
    });

    it('should revert if creating a subdomain under a domain that the current address does not own', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), owner);

      await asyncExpectThrowVMRevert(() => rns.subdomains.create('alice.rsk', 'test', owner));
    });

    it('should not create a subdomain if is not available', async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
      await rns.subdomains.create('alice.rsk', 'test', owner);

      // create it again should fail
      await asyncExpectThrowRNSError(() => rns.subdomains.create('alice.rsk', 'test', owner), SUBDOMAIN_NOT_AVAILABLE);
    });
  });

  describe('happy paths', () => {
    const addr = '0x0000000000000000000000000000000001000006';
    let expectedAddr: string;
    let expectedOwner: string;
    let tx: TransactionReceipt | null;

    beforeEach(async () => {
      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
    });

    it('no owner and no addr provided', async () => {
      tx = await rns.subdomains.create('alice.rsk', 'test');

      expectedOwner = defaultSender;
      expectedAddr = ZERO_ADDRESS;
    });

    it('owner provided, no addr', async () => {
      tx = await rns.subdomains.create('alice.rsk', 'test', owner);

      expectedOwner = owner;
      expectedAddr = ZERO_ADDRESS;
    });

    it('owner and addr provided, owner equals sender', async () => {
      tx = await rns.subdomains.create('alice.rsk', 'test', defaultSender, addr);

      expectedOwner = defaultSender;
      expectedAddr = addr;
    });

    it('owner and addr provided, owner is not the sender', async () => {
      tx = await rns.subdomains.create('alice.rsk', 'test', owner, addr);

      expectedOwner = owner;
      expectedAddr = addr;
    });

    it('owner empty and addr provided', async () => {
      tx = await rns.subdomains.create('alice.rsk', 'test', '', addr);

      expectedOwner = defaultSender;
      expectedAddr = addr;
    });

    afterEach(async () => {
      const actualOwner = await registry.owner(namehash('test.alice.rsk'));
      expect(actualOwner).toEqual(expectedOwner);

      const actualAddr = await publicResolver.addr(namehash('test.alice.rsk'));
      expect(actualAddr).toEqual(expectedAddr);

      expect(tx).toBeTruthy();
      expect(tx?.transactionHash).toBeTruthy();

      tx = null;
      expectedAddr = '';
      expectedOwner = '';
    });
  });

  describe('custom tx options', () => {
    const addr = '0x0000000000000000000000000000000001000006';

    it('should send custom gasPrice', async () => {
      const gasPrice = 70000000;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txReceipt = await rns.subdomains.create('alice.rsk', 'test', owner, addr, { gasPrice });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gas', async () => {
      const gas = 800000;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txReceipt = await rns.subdomains.create('alice.rsk', 'test', owner, addr, { gas });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gas).toEqual(gas);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), from);

      const txReceipt = await rns.subdomains.create('alice.rsk', 'test', owner, addr, { from });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.from).toEqual(from);
    });
  });
});

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - subdomains.create public nodes', (name, blockchainApiInstance) => {
  test('should fail when web3 instance does not contain accounts to sign the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.subdomains.create('multichain.testing.rsk', 'check'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
