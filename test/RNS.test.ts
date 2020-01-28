import Web3 from 'web3';
import RNS from '../src/index';
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';

describe ('network detection', () => {
  test('mainnet', async () => {
    const web3 = new Web3('https://public-node.rsk.co');
    const rns = new RNS(web3);
    const addr = await rns.addr('testing.rsk');
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  })

  test('testnet', async () => {
    const web3 = new Web3('https://public-node.testnet.rsk.co');
    const rns = new RNS(web3);
    const addr = await rns.addr('testing.rsk');
    expect(addr).toBe('0x0000000000000000000000000000000001000006');
  })
})

describe('compose', () => {
  test('mainnet', async () => {
    const web3 = new Web3('https://public-node.rsk.co')
    const rns = new RNS(web3)
    await rns.compose()
    expect(rns.contracts.registry._address.toLowerCase()).toBe(RNSRegistryData.address.rskMainnet)
  })

  test('testnet', async () => {
    const web3 = new Web3('https://public-node.testnet.rsk.co');
    const rns = new RNS(web3);
    await rns.compose()
    expect(rns.contracts.registry._address.toLowerCase()).toBe(RNSRegistryData.address.rskTestnet)
  })
});

test('addr', async () => {
  const web3 = new Web3('https://public-node.rsk.co');
  const rns = new RNS(web3);
  const addr = await rns.addr('testing.rsk');
  expect(addr).toBe('0x0000000000000000000000000000000001000006');
});
