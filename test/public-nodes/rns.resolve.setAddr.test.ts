import Web3 from 'web3';
import RNS from '../../src/index';
import { NO_ACCOUNTS_TO_SIGN } from '../../src/errors';
import { asyncExpectThrowRNSError } from '../utils';

const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

let rns: RNS;

describe('rns.setAddr', () => {
  describe('should fail when web3 instance does not contain accounts to sing the tx', () => {
    describe('mainnet', () => {
      beforeEach(() => {
        const web3 = new Web3(PUBLIC_NODE_MAINNET);
        rns = new RNS(web3);
      });

      test('setAddr', async () => {
        await asyncExpectThrowRNSError(
          async () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001'),
          NO_ACCOUNTS_TO_SIGN,
        );
      });
    });

    describe('testnet', () => {
      beforeEach(() => {
        const web3 = new Web3(PUBLIC_NODE_TESTNET);
        rns = new RNS(web3);
      });

      test('setAddr', async () => {
        await asyncExpectThrowRNSError(
          async () => rns.setAddr('testing.rsk', '0x0000000000000000000000000000000000000001'),
          NO_ACCOUNTS_TO_SIGN,
        );
      });
    });
  });
});
