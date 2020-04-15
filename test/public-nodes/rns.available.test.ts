import Web3 from 'web3';
import RNS from '../../src/index';
import { PUBLIC_NODE_MAINNET } from '../utils';

describe('subdomains.available', () => {
  let rns: RNS;

  describe('happy paths testnet', () => {
    beforeEach(async () => {
      const web3 = new Web3(PUBLIC_NODE_MAINNET);
      rns = new RNS(web3);
    });

    it('should return an empty array just rsk', async () => {
      const available = await rns.available('rsk');
      expect(available).toEqual([]);
    });

    it('should return an empty array when sending a label length < 5', async () => {
      const available = await rns.available('bob');
      expect(available).toEqual([]);
    });

    it('should return an array when sending a label length = 5', async () => {
      const available = await rns.available('noexi');
      expect(available).toEqual(['noexi.rsk']);
    });

    it('should return an array when sending a label length > 5', async () => {
      const available = await rns.available('noexis');
      expect(available).toEqual(['noexis.rsk']);
    });

    it('should return array when sending a non existant label', async () => {
      const available = await rns.available('noexists');
      expect(available).toEqual(['noexists.rsk']);
    });

    it('should return an empty array when sending an existant label', async () => {
      const available = await rns.available('testing');
      expect(available).toEqual([]);
    });

    it('should return false when sending a label length < 5', async () => {
      const available = await rns.available('bob.rsk');
      expect(available).toEqual(false);
    });

    it('should return true when sending a label length = 5', async () => {
      const available = await rns.available('noexi.rsk');
      expect(available).toEqual(true);
    });

    it('should return true when sending a label length > 5', async () => {
      const available = await rns.available('noexis.rsk');
      expect(available).toEqual(true);
    });

    it('should return false when sending a registered domain', async () => {
      const available = await rns.available('testing.rsk');
      expect(available).toEqual(false);
    });

    it('should return true when sending a non registered domain', async () => {
      const available = await rns.available('noexists.rsk');
      expect(available).toEqual(true);
    });
  });
});
