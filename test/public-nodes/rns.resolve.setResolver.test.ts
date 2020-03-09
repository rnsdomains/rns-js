import Web3 from 'web3';
import RNS from '../../src/index';
import { NO_ACCOUNTS_TO_SIGN } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

describe('setResolver', () => {
  describe('should fail when web3 instance does not contain accounts to sign the tx', () => {
    test('mainnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(
        async () => rns.setResolver('multichain.testing.rsk', '0x0000000000000000000000000000000000000001'),
        NO_ACCOUNTS_TO_SIGN,
      );
    });

    test('testnet', async () => {
      const web3 = new Web3(PUBLIC_NODE_TESTNET);
      const rns = new RNS(web3);
      await asyncExpectThrowRNSError(
        async () => rns.setResolver('multichain.testing.rsk', '0x0000000000000000000000000000000000000001'),
        NO_ACCOUNTS_TO_SIGN,
      );
    });
  });
});