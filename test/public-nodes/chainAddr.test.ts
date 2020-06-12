import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { NO_CHAIN_ADDR_RESOLUTION, NO_RESOLVER, NO_CHAIN_ADDR_RESOLUTION_SET } from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';
import { ChainId } from '../../src/types';

describe.each([
  ['web3 mainnet', new Web3(PUBLIC_NODE_MAINNET)],
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk3 mainnet', new Rsk3(PUBLIC_NODE_MAINNET)],
  ['rsk3 testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - chainAddr resolution', (name, blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  it('should resolve a name for BTC with multichain resolver', async () => {
    const addr = await rns.addr('multichain.testing.rsk', ChainId.BTC);
    expect(addr).toBe('1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG');
  });

  it('should resolve a name for ETH with multichain resolver', async () => {
    const addr = await rns.addr('multichain.testing.rsk', ChainId.ETH);
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  });

  it('should throw an error when resolver has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolver.multichain.testing.rsk', ChainId.BTC), NO_RESOLVER);
  });

  it('should throw an error when resolver does not implement chainAddr nor addr interface', async () => {
    // resolver address is the NameResolver contract. an ERC165 that not supports addr interface
    await asyncExpectThrowRNSError(() => rns.addr('nochainaddrresolver.multichain.testing.rsk', ChainId.BTC), NO_CHAIN_ADDR_RESOLUTION);
  });

  it('should throw an error when no resolution set with multichain resolver', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolution.multichain.testing.rsk', ChainId.BTC), NO_CHAIN_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noexists.multichain.testing.rsk', ChainId.BTC), NO_RESOLVER);
  });
});

describe.each([
  ['web3 testnet', new Web3(PUBLIC_NODE_TESTNET)],
  ['rsk3 testnet', new Rsk3(PUBLIC_NODE_TESTNET)],
])('%s - chainAddr resolution only testnet', (name, blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  it('should throw an error when no resolution set with definitive resolver', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('multi.definitive.testing.rsk', ChainId.LTC), NO_CHAIN_ADDR_RESOLUTION_SET);
  });

  it('should resolve a name for BTC with definitive resolver', async () => {
    const addr = await rns.addr('multi.definitive.testing.rsk', ChainId.BTC);
    expect(addr).toBe('1Ftu4C8VW18RkB8PZxXwwHocMLyEynLcrG');
  });

  it('should resolve a name for ETH with definitive resolver', async () => {
    const addr = await rns.addr('multi.definitive.testing.rsk', ChainId.ETH);
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  });
});
