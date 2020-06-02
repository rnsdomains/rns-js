import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import {
  contract, web3, defaultSender,
} from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import Web3 from 'web3';
import Rsk3 from '@rsksmart/rsk3';
import { NO_RESOLVER } from '../../src/errors';
import { ZERO_ADDRESS } from '../../src/constants';
import { asyncExpectThrowRNSError } from '../utils';
import RNS from '../../src/index';
import { labelhash } from '../../src/utils';
import { Lang } from '../../src/types/enums';
import { Options } from '../../src/types';

const web3Instance = web3 as unknown as Web3;
const rsk3Instance = new Rsk3(web3.currentProvider);

describe.each([
  [web3Instance],
  [rsk3Instance],
])('addr resolution', (blockchainApiInstance) => {
  describe.each([
    [Lang.en],
    [Lang.es],
    [Lang.ja],
    [Lang.ko],
    [Lang.pt],
    [Lang.ru],
    [Lang.zh],
  ])('- lang %s', (lang) => {
    const TLD = 'rsk';

    let registry: any;
    let publicResolver: any;
    let options: Options;

    beforeEach(async () => {
      const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
      const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
      registry = await Registry.new();
      publicResolver = await PublicResolver.new(registry.address);

      await registry.setDefaultResolver(publicResolver.address);

      await registry.setSubnodeOwner('0x00', labelhash(TLD), defaultSender);

      options = {
        contractAddresses: {
          registry: registry.address,
        },
        lang,
      };

      await registry.setSubnodeOwner(namehash(TLD), labelhash('noresolver'), defaultSender);
      await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);
    });

    it('should throw an error in english', async () => {
      const rns = new RNS(blockchainApiInstance, options);

      await asyncExpectThrowRNSError(() => rns.addr('noresolver.rsk'), NO_RESOLVER, lang);
    });
  });
});
