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

export default class implements Resolutions {
  constructor(private web3: Web3, private registry: Contract) { }

  async addr(domain: string): Promise<string> {
    const node: string = namehash(domain);

    const resolverAddress: string = await this.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new Error(NO_RESOLVER);
    }

    const isErc165Contract = await hasMethod(this.web3, resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new Error(NO_ADDR_RESOLUTION);
    }

    const addrResolver: Contract = createAddrResolver(this.web3, resolverAddress);
    
    const supportsAddr: boolean = await addrResolver.methods.supportsInterface(ADDR_INTERFACE).call();
    if (!supportsAddr) { 
      throw new Error(NO_ADDR_RESOLUTION);
    }

    const addr: string = await addrResolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS){ 
      throw new Error(NO_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  async chainAddr(domain: string, chainId: ChainId) {
    const node: string = namehash(domain);

    const resolverAddress: string = await this.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new Error(NO_RESOLVER);
    }

    const isErc165Contract = await hasMethod(this.web3, resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new Error(NO_CHAIN_ADDR_RESOLUTION);
    }

    const chainAddrResolver: Contract = createChainAddrResolver(this.web3, resolverAddress);
    
    const supportsChainAddr: boolean = await chainAddrResolver.methods.supportsInterface(CHAIN_ADDR_INTERFACE).call();
    if (!supportsChainAddr) { 
      throw new Error(NO_CHAIN_ADDR_RESOLUTION);
    }

    const addr: string = await chainAddrResolver.methods.chainAddr(node, chainId.toString()).call();
    if (!addr || addr === ZERO_ADDRESS){ 
      throw new Error(NO_CHAIN_ADDR_RESOLUTION_SET);
    }

    return addr;
  }
}