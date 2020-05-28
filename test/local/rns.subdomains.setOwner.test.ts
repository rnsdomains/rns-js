import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  accounts, contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { Options, NetworkId } from '../../src/types';
import {
  asyncExpectThrowRNSError, asyncExpectThrowVMRevert, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET,
} from '../utils';
import {
  INVALID_DOMAIN, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS,
  DOMAIN_NOT_EXISTS, INVALID_LABEL, NO_ACCOUNTS_TO_SIGN, INVALID_CHECKSUM_ADDRESS, INVALID_ADDRESS,
} from '../../src/errors';
import { labelhash } from '../../src/utils';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - subdomains.setOwner', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
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

    rns = new RNS(blockchainApiInstance, options);
  });

  describe('validations', () => {
    it('should fail when instantiating the lib with RSK networkId and owner address has an invalid checksum for RSK', async () => {
      options = {
        contractAddresses: {
          registry: registry.address,
        },
        networkId: NetworkId.RSK_MAINNET,
      };

      rns = new RNS(web3Instance, options);

      const invalid = '0x53BF4d5cF81F8c52644912cfae4d0E3EA7faDd5B'; // valid for ethereum

      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('alice.rsk', 'willfail', invalid), INVALID_CHECKSUM_ADDRESS);
    });

    it('should fail when invalid owner address', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('alice.rsk', 'willfail', 'invalid'), INVALID_ADDRESS);
    });

    it('should not fail when sending a subdomain', async () => {
      await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
      await registry.setSubnodeOwner(namehash('alice.rsk'), labelhash('subdomain'), defaultSender);
      await rns.subdomains.setOwner('subdomain.alice.rsk', 'check', owner);
    });

    it('should not fail when sending just a tld if the sender is the owner of the tld', async () => {
      await rns.subdomains.setOwner('rsk', 'alice', owner);
    });

    it('should fail when sending an empty domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending an just a dot with no labels', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('.', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when not sending an .rsk domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('domain.notrsk', 'willfail', owner), SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    });

    it('should fail when sending upper case domain', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('DOMAIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when sending invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('DOM-AIN.rsk', 'willfail', owner), INVALID_DOMAIN);
    });

    it('should fail when given domain does not exist', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('noexists.rsk', 'willfail', owner), DOMAIN_NOT_EXISTS);
    });

    it('should fail when sending empty label', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('domain.rsk', '', owner), INVALID_LABEL);
    });

    it('should fail when sending label with upper case characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('domain.rsk', 'iNVAlid', owner), INVALID_LABEL);
    });

    it('should fail when sending label with invalid characters', async () => {
      await asyncExpectThrowRNSError(() => rns.subdomains.setOwner('domain.rsk', 'iNVA-lid', owner), INVALID_LABEL);
    });
  });

  it('should create a subdomain if is available', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    await rns.subdomains.setOwner('alice.rsk', 'test', owner);

    const actualOwner = await registry.owner(namehash('test.alice.rsk'));
    expect(actualOwner).toEqual(owner);
  });

  it('should return a tx receipt', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    const tx = await rns.subdomains.setOwner('alice.rsk', 'test', owner);

    expect(tx.transactionHash).toBeTruthy();
  });

  it('should create a subdomain even if is not available', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);
    await rns.subdomains.setOwner('alice.rsk', 'test', defaultSender);

    let actualOwner = await registry.owner(namehash('test.alice.rsk'));
    expect(actualOwner).toEqual(defaultSender);

    await rns.subdomains.setOwner('alice.rsk', 'test', owner);
    actualOwner = await registry.owner(namehash('test.alice.rsk'));
    expect(actualOwner).toEqual(owner);
  });

  it('should revert if creating a subdomain under a domain that the current address does not own', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), owner);

    await asyncExpectThrowVMRevert(() => rns.subdomains.setOwner('alice.rsk', 'test', owner));
  });

  describe('custom tx options', () => {
    it('should send custom gasPrice', async () => {
      const gasPrice = 70000000;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txReceipt = await rns.subdomains.setOwner('alice.rsk', 'test', owner, { gasPrice });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gasPrice).toEqual(gasPrice.toString());
    });

    it('should send custom gasLimit', async () => {
      const gasLimit = 800000;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

      const txReceipt = await rns.subdomains.setOwner('alice.rsk', 'test', owner, { gasLimit });

      const tx = await web3.eth.getTransaction(txReceipt.transactionHash);

      expect(tx.gas).toEqual(gasLimit);
      expect(tx.from).toEqual(defaultSender);
    });

    it('should send custom sender', async () => {
      const [from] = accounts;

      await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), from);

      const txReceipt = await rns.subdomains.setOwner('alice.rsk', 'test', owner, { from });

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
])('%s - subdomains.setOwner public nodes', (name, blockchainApiInstance) => {
  test('should fail when web3 instance does not contain accounts to sign the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.subdomains.setOwner('multichain.testing.rsk', 'check', '0x0000000000000000000000000000000000000001'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
