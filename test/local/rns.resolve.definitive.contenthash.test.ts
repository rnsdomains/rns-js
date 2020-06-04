
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  NO_RESOLVER, UNSUPPORTED_CONTENTHASH_PROTOCOL, NO_CONTENTHASH_INTERFACE, NO_CONTENTHASH_SET,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { Options } from '../../src/types';
import { labelhash } from '../../src/utils';
import { deployDefinitiveResolver } from './helpers';
import ContenthashHelper from '../../src/contenthash-helper';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - contenthash resolution', (name, blockchainApiInstance) => {
  const TLD = 'rsk';

  let registry: any;
  let rns: RNS;
  let options: Options;
  let proxy: any;
  const contenthashHelper = new ContenthashHelper();
  beforeEach(async () => {
    ({ proxy, registry } = await deployDefinitiveResolver());

    options = {
      contractAddresses: {
        registry: registry.address,
      },
    };

    rns = new RNS(blockchainApiInstance, options);
  });

  const shouldDecodeProperly = async (expected: string) => {
    const encoded = contenthashHelper.encodeContenthash(expected);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await proxy.methods['setContenthash(bytes32,bytes)'](namehash('alice.rsk'), encoded, { from: defaultSender });

    const contenthash = await rns.contenthash('alice.rsk');
    expect(contenthash).toBe(expected);
  };

  it('should get ipfs contenthash', async () => {
    const ipfsHash = 'ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
    await shouldDecodeProperly(ipfsHash);
  });

  it('should get bzz contenthash', async () => {
    const swarmHash = 'bzz://d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162';
    await shouldDecodeProperly(swarmHash);
  });

  it('should get onion contenthash', async () => {
    const onionHash = 'onion://zqktlwi4fecvo6ri';
    await shouldDecodeProperly(onionHash);
  });

  it('should get onion3 contenthash', async () => {
    const onionHash = 'onion3://p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd';
    await shouldDecodeProperly(onionHash);
  });

  it('should fail if invalid contenthash', async () => {
    const encoded = '0x000000123456789abcdef';

    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);
    await proxy.methods['setContenthash(bytes32,bytes)'](namehash('alice.rsk'), encoded, { from: defaultSender });

    await asyncExpectThrowRNSError(() => rns.contenthash('alice.rsk'), UNSUPPORTED_CONTENTHASH_PROTOCOL);
  });

  it('should fail if no contenthash set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('alice'), defaultSender);

    await asyncExpectThrowRNSError(() => rns.contenthash('alice.rsk'), NO_CONTENTHASH_SET);
  });

  it('should throw an error when resolver does not support contenthash interface', async () => {
    // the address is the NameResolver contract, an ERC165 that not supports chainAddr interface
    const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
    const nameResolver = await NameResolver.new(registry.address);

    await registry.setSubnodeOwner(namehash(TLD), labelhash('anothererc165'), defaultSender);
    await registry.setResolver(namehash('anothererc165.rsk'), nameResolver.address);
    await asyncExpectThrowRNSError(() => rns.contenthash('anothererc165.rsk'), NO_CONTENTHASH_INTERFACE);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.contenthash('noresolver.rsk'), NO_RESOLVER);
  });
});
