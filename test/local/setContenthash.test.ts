
import { web3, defaultSender } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import {
  NO_RESOLVER, UNSUPPORTED_CONTENTHASH_PROTOCOL, NO_ACCOUNTS_TO_SIGN,
} from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { deployDefinitiveResolver, getRNSInstance } from './helpers';
import ContenthashHelper from '../../src/contenthash-helper';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  ['web3', web3Instance],
  ['rsk3', rsk3Instance],
])('%s - setContenthash', (name, blockchainApiInstance) => {
  let registry: any;
  let rns: RNS;
  let proxy: any;
  const contenthashHelper = new ContenthashHelper();

  beforeEach(async () => {
    ({ proxy, registry } = await deployDefinitiveResolver());

    rns = getRNSInstance(blockchainApiInstance, registry);
  });

  const shouldEncodeProperly = async (contenthash: string) => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    await rns.setContenthash('alice.rsk', contenthash);

    const actual = await proxy.methods['contenthash(bytes32)'](namehash('alice.rsk'), { from: defaultSender });

    const expected = contenthash ? contenthashHelper.encodeContenthash(contenthash) : null;
    expect(actual).toBe(expected);
  };

  it('should set ipfs contenthash', async () => {
    const ipfsHash = 'ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
    await shouldEncodeProperly(ipfsHash);
  });

  it('should set bzz contenthash', async () => {
    const swarmHash = 'bzz://d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162';
    await shouldEncodeProperly(swarmHash);
  });

  it('should set onion contenthash', async () => {
    const onionHash = 'onion://zqktlwi4fecvo6ri';
    await shouldEncodeProperly(onionHash);
  });

  it('should set onion3 contenthash', async () => {
    const onionHash = 'onion3://p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd';
    await shouldEncodeProperly(onionHash);
  });

  it('should set empty contenthash', async () => {
    const emptyHash = '';
    await shouldEncodeProperly(emptyHash);
  });

  it('should fail if invalid contenthash', async () => {
    const hash = 'onion1234://zqktlwi4fecvo6ri';

    await registry.setSubnodeOwner(namehash('rsk'), labelhash('alice'), defaultSender);

    await asyncExpectThrowRNSError(() => rns.setContenthash('alice.rsk', hash), UNSUPPORTED_CONTENTHASH_PROTOCOL);
  });

  it('should throw an error when resolver has not been set', async () => {
    await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolver'), defaultSender);
    await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

    await asyncExpectThrowRNSError(() => rns.contenthash('noresolver.rsk'), NO_RESOLVER);
  });
});

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - setContenthash public nodes', (name, blockchainApiInstance) => {
  test('should fail when web3 instance does not contain accounts to sign the tx', async () => {
    const rns = new RNS(blockchainApiInstance);
    await asyncExpectThrowRNSError(
      () => rns.setContenthash('testing.rsk', 'check'),
      NO_ACCOUNTS_TO_SIGN,
    );
  });
});
