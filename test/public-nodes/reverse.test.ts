import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import RNS from '../../src/index';
import { NO_REVERSE_RESOLUTION_SET, NO_NAME_RESOLUTION } from '../../src/errors';
import { asyncExpectThrowRNSError, PUBLIC_NODE_MAINNET, PUBLIC_NODE_TESTNET } from '../utils';

describe.each([
  new Web3(PUBLIC_NODE_MAINNET),
  new Web3(PUBLIC_NODE_TESTNET),
  new Rsk3(PUBLIC_NODE_MAINNET),
  new Rsk3(PUBLIC_NODE_TESTNET),
])('name resolution', (blockchainApiInstance) => {
  let rns: RNS;

  beforeEach(() => {
    rns = new RNS(blockchainApiInstance);
  });

  it('should resolve an address', async () => {
    const name = await rns.reverse('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
    expect(name).toBe('testing.rsk');
  });

  describe('should throw an error when ERC165 that not support name interface (public resolver) as reverse resolver', () => {
    it('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      rns = new RNS(web3);
      await asyncExpectThrowRNSError(() => rns.reverse('0x1c0884e81161B526f6A4baBC557F97649a2c74CC'), NO_NAME_RESOLUTION);
    });
  });

  describe('should throw an error when the address has a resolver but no resolution set', () => {
    it('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      rns = new RNS(web3);
      await asyncExpectThrowRNSError(() => rns.reverse('0x0BC10AFD0Fc8344Ac3bBDDEE72221F148Ee0Bc61'), NO_REVERSE_RESOLUTION_SET);
    });
  });

  it('should throw an error when reverse resolution has not been set', async () => {
    await asyncExpectThrowRNSError(() => rns.reverse('0x0000000000000000000000000000000000000001'), NO_REVERSE_RESOLUTION_SET);
  });
});
