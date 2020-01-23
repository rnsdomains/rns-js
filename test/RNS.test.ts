import { RNS } from '../src/index';
import Web3 from 'web3';

test('getAddr', async () => {
  const web3 = new Web3('https://public-node.testnet.rsk.co');

  const rns = new RNS(web3);
  const addr = await rns.getAddr('javier.rsk');
  expect(addr).toBe('0xe9a4e6fae8217E032A08848E227d2b57D3E1e0A5');
});