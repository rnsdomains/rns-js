import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import { accounts, contract, web3, defaultSender } from '@openzeppelin/test-environment';
import { hash as namehash } from 'eth-ens-namehash';
import RNS from '../../src/index';
import Web3 from 'web3';

const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);

describe('addr', () => {
  const [ owner, resolution ] = accounts;

  const TLD = 'rsk';
  const TEST_LABEL = 'alice';
  const TEST_DOMAIN = `${TEST_LABEL}.${TLD}`;
  const TEST_NODE = namehash(TEST_DOMAIN);

  let registry: any;
  let publicResolver: any;
  let rns: RNS;

  beforeEach(async () => {
    registry = await Registry.new();
    publicResolver = await PublicResolver.new(registry.address);
    await registry.setDefaultResolver(publicResolver.address);

    await registry.setSubnodeOwner('0x00', web3.utils.sha3(TLD), defaultSender);
    await registry.setSubnodeOwner(namehash(TLD), web3.utils.sha3(TEST_LABEL), defaultSender);
    
    await publicResolver.setAddr(TEST_NODE, resolution);

    const options = { 
      contractAddresses: {
        registry: registry.address
      }
    }

    rns = new RNS(web3 as unknown as Web3, options);
  });

  it('sso', async () => {
    let isAvailable = await rns.isSubdomainAvailable(TEST_DOMAIN, 'test');
    expect(isAvailable).toBe(true);
    
    await rns.createSubdomain(TEST_DOMAIN, 'test', owner);
    isAvailable = await rns.isSubdomainAvailable(TEST_DOMAIN, 'test');
    expect(isAvailable).toBe(false);
  });
});