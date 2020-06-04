import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { NO_ADDR_RESOLUTION_SET, NO_RESOLVER, NO_ADDR_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';

describe.each([
  new Web3(PUBLIC_NODE_MAINNET),
  new Web3(PUBLIC_NODE_TESTNET),
  new Rsk3(PUBLIC_NODE_MAINNET),
  new Rsk3(PUBLIC_NODE_TESTNET),
])('addr resolution', (blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  it('should resolve a name', async () => {
    const addr = await rns.addr('testing.rsk');
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  });

  it('should throw an error when resolver has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolver.testing.rsk'), NO_RESOLVER);
  });

  it('should throw an error when resolver does not implement addr interface', async () => {
    // resolver address is the NameResolver contract. an ERC165 that not supports addr interface
    await asyncExpectThrowRNSError(() => rns.addr('noaddrresolver.testing.rsk'), NO_ADDR_RESOLUTION);
  });

  it('should throw an error when no resolution set', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noresolution.testing.rsk'), NO_ADDR_RESOLUTION_SET);
  });

  it('should throw an error when domain do not exist', async () => {
    await asyncExpectThrowRNSError(() => rns.addr('noexists.testing.rsk'), NO_RESOLVER);
  });
});
