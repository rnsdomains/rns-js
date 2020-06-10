import { web3, defaultSender, accounts } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_REVERSE_RESOLUTION_SET, NO_NAME_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import {
  deployRegistryAndCreateTldNode, getRNSInstance, deployNameResolver,
  deployReverseRegistrar, deployPublicResolver,
} from './helpers';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - name resolution', (name, blockchainApiInstance) => {
  let registry: any;
  let nameResolver: any;
  let reverseRegistrar: any;
  let rns: RNS;

  beforeEach(async () => {
    registry = await deployRegistryAndCreateTldNode();
    nameResolver = await deployNameResolver(registry);
    reverseRegistrar = await deployReverseRegistrar(registry);

    await registry.setSubnodeOwner('0x00', labelhash('reverse'), defaultSender);
    await registry.setResolver(namehash('reverse'), nameResolver.address);
    await registry.setSubnodeOwner(namehash('reverse'), labelhash('addr'), reverseRegistrar.address);

    rns = getRNSInstance(blockchainApiInstance, registry);
  });

  it('should resolve an address', async () => {
    const [alice] = accounts;

    const expected = 'alice.rsk';
    await reverseRegistrar.setName(expected, { from: alice });
    const actual = await rns.reverse(alice);
    expect(actual).toBe(expected);
  });

  it('should throw an error when ERC165 that not support name interface (public resolver) as reverse resolver', async () => {
    const [alice] = accounts;
    const publicResolver = await deployPublicResolver(registry);

    await reverseRegistrar.claimWithResolver(alice, publicResolver.address, { from: alice });
    await asyncExpectThrowRNSError(() => rns.reverse(alice), NO_NAME_RESOLUTION);
  });

  it('should throw an error when the address has a resolver but no resolution set', async () => {
    const [alice] = accounts;

    await reverseRegistrar.claim(alice, { from: alice });
    await asyncExpectThrowRNSError(() => rns.reverse(alice), NO_REVERSE_RESOLUTION_SET);
  });

  it('should throw an error when reverse resolution has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.reverse('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
  });
});
