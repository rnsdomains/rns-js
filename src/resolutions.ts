import Web3 from 'web3/types';
import { Contract } from 'web3-eth-contract/types';
import { hash as namehash } from 'eth-ens-namehash';
import { hasMethod } from './utils';
import { createAddrResolver, createChainAddrResolver } from './factories';
import { 
  NO_ADDR_RESOLUTION, NO_ADDR_RESOLUTION_SET, NO_RESOLVER,
  NO_CHAIN_ADDR_RESOLUTION, NO_CHAIN_ADDR_RESOLUTION_SET
} from './errors';
import { ZERO_ADDRESS, ADDR_INTERFACE, ERC165_INTERFACE, CHAIN_ADDR_INTERFACE } from './constants';
import { ChainId, Resolutions } from './types';

interface ResolverConstants {
  INTERFACE: string;
  ERROR: string;
  FACTORY(web3: Web3, address: string);
}

export default class implements Resolutions {
  constructor(private web3: Web3, private registry: Contract) { }

  private async _checkResolverAndErc165(node: string, constants: ResolverConstants): Promise<Contract> {
    const resolverAddress: string = await this.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new Error(NO_RESOLVER);
    }

    const isErc165Contract = await hasMethod(this.web3, resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new Error(constants.ERROR);
    }

    const resolver: Contract = constants.FACTORY(this.web3, resolverAddress);
    
    const supportsInterface: boolean = await resolver.methods.supportsInterface(constants.INTERFACE).call();
    if (!supportsInterface) { 
      throw new Error(constants.ERROR);
    }

    return resolver;
  } 

  async addr(domain: string): Promise<string> {
    const node: string = namehash(domain);

    const addrConstants: ResolverConstants = {
      ERROR: NO_ADDR_RESOLUTION,
      INTERFACE: ADDR_INTERFACE,
      FACTORY: createAddrResolver
    }

    const resolver = await this._checkResolverAndErc165(node, addrConstants);

    const addr: string = await resolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS){ 
      throw new Error(NO_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  async chainAddr(domain: string, chainId: ChainId) {
    const node: string = namehash(domain);

    const chainAddrConstants: ResolverConstants = {
      ERROR: NO_CHAIN_ADDR_RESOLUTION,
      INTERFACE: CHAIN_ADDR_INTERFACE,
      FACTORY: createChainAddrResolver
    }

    const resolver = await this._checkResolverAndErc165(node, chainAddrConstants);

    const addr: string = await resolver.methods.chainAddr(node, chainId).call();
    if (!addr || addr === ZERO_ADDRESS){ 
      throw new Error(NO_CHAIN_ADDR_RESOLUTION_SET);
    }

    return addr;
  }
}