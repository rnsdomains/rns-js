import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import {
  contract, web3, defaultSender, accounts,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import { expectRevert } from '@openzeppelin/test-helpers';
import {
  INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS, DOMAIN_NOT_EXISTS,
} from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';

describe('setResolver', () => {
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

  it('should set a resolver address', async () => {
    const addr = '0x0000000000000000000000000000000001000006';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await rns.setResolver('alice.rsk', addr);

    const actualResolver = await registry.resolver(namehash('alice.rsk'));
    expect(actualResolver).toBe(addr);
  });

  it('should throw an error when address is invalid', async () => {
    await asyncExpectThrowRNSError(async () => rns.setResolver('alice.rsk', 'invalidaddress'), INVALID_ADDRESS);
  });

  it('should throw an error when address has invalid checksum', async () => {
    await asyncExpectThrowRNSError(async () => rns.setResolver('alice.rsk', '0x0000000000000000000000000000000001ABcdEF'), INVALID_CHECKSUM_ADDRESS);
  });

  it('should throw an error when domain does not exists has invalid checksum', async () => {
    await asyncExpectThrowRNSError(async () => rns.setResolver('noexists.rsk', '0x0000000000000000000000000000000001000006'), DOMAIN_NOT_EXISTS);
  });

  it('should VM revert when domain is not owned by the sender', async () => {
    const [account] = accounts;
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), account);

    expectRevert(rns.setResolver('noexists.rsk', '0x0000000000000000000000000000000001000006'));
  });
});