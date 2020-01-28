import Web3 from 'web3';
import RNS from '../src/index';

test('addr', async () => {
  const web3 = new Web3('https://public-node.rsk.co');
  const rns = new RNS(web3);
  const addr = await rns.addr('testing.rsk');
  expect(addr).toBe('0x0000000000000000000000000000000001000006');
});
