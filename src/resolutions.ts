import Web3 from 'web3/types';
import { Contract } from 'web3-eth-contract/types';
import { hash as namehash } from 'eth-ens-namehash';
import { hasMethod } from './utils';
import { createAddrResolver, createChainAddrResolver, createNameResolver } from './factories';
import { 
  NO_ADDR_RESOLUTION, NO_ADDR_RESOLUTION_SET, NO_RESOLVER,
  NO_CHAIN_ADDR_RESOLUTION, NO_CHAIN_ADDR_RESOLUTION_SET,
  NO_NAME_RESOLUTION, NO_REVERSE_RESOLUTION_SET
} from './errors';
import { 
  ZERO_ADDRESS, ADDR_INTERFACE, ERC165_INTERFACE,
  CHAIN_ADDR_INTERFACE, NAME_INTERFACE 
} from './constants';
import { ChainId, Resolutions, Options } from './types';
import { Composer } from './composer';

/**
 * Standard resolution protocols.
 */
export default class extends Composer implements Resolutions {
  /**
   * 
   * @param web3 - current Web3 instance
   * @param registry - RNS Registry Web3 Contract instance
   */
  constructor(public web3: Web3, private options?: Options) {
    super(web3, options);
  }

  /**
   * Instance the resolver associated with the given node and checks if is valid according to the given interface.
   *
   * @throws provided `errorMessage` if the resolver is not ERC165 or it doesn't implement the necessary given interface.
   * @throws `noResolverError` || NO_RESOLVER when the domain doesn't have resolver - KB003.
   * 
   * @param node - namehash of the domain to resolve 
   * @param methodInterface - standard resolution interface id
   * @param errorMessage - error message in case the resolver is not valid
   * @param contractFactory - factory function used to instance the resolver
   * @param noResolverError - custom error to throw if no resolver found
   */
  private async _createResolver(
    node: string,
    methodInterface: string,
    errorMessage: string,
    contractFactory: (web3: Web3, address: string) => Contract,
    noResolverError?: string
  ): Promise<Contract> {
    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new Error(noResolverError || NO_RESOLVER);
    }

    const isErc165Contract = await hasMethod(this.web3, resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new Error(errorMessage);
    }

    const resolver: Contract = contractFactory(this.web3, resolverAddress);
    
    const supportsInterface: boolean = await resolver.methods.supportsInterface(methodInterface).call();
    if (!supportsInterface) { 
      throw new Error(errorMessage);
    }

    return resolver;
  } 

  /**
   * addr resolution protocol.
   
   * @throws NO_ADDR_RESOLUTION_SET if the resolution hasn't been set yet - KB001.
   * @throws NO_ADDR_RESOLUTION it has an invalid resolver - KB002.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * 
   * @param domain - Domain to be resolved
   * 
   * @return 
   * Address resolution for the given domain
   */
  async addr(domain: string): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, ADDR_INTERFACE, NO_ADDR_RESOLUTION, createAddrResolver);

    const addr: string = await resolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS){ 
      throw new Error(NO_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  /**
   * chainAddr resolution protocol.
   *
   * @throws NO_CHAIN_ADDR_RESOLUTION_SET if the resolution hasn't been set yet - KB007.
   * @throws NO_CHAIN_ADDR_RESOLUTION it has an invalid resolver - KB006.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * 
   * @param domain - Domain to be resolved
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   * 
   * @return 
   * Address resolution for a domain in a given chain
   */
  async chainAddr(domain: string, chainId: ChainId): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, CHAIN_ADDR_INTERFACE, NO_CHAIN_ADDR_RESOLUTION, createChainAddrResolver);

    const addr: string = await resolver.methods.chainAddr(node, chainId).call();
    if (!addr || addr === ZERO_ADDRESS){ 
      throw new Error(NO_CHAIN_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  /**
   * name resolution protocol.
   *
   * @throws NO_REVERSE_RESOLUTION_SET when the domain has not the reverse resolution set - KB014.
   * @throws NO_NAME_RESOLUTION if has an invalid name resolver - KB013.
   * 
   * @param address - address to be resolved
   * 
   * @return 
   * Domain or subdomain associated to the given address.
   */
  async name(address: string): Promise<string> {
    await this.compose();
    address = address.substring(2).toLowerCase(); // remove '0x' and convert it to lowercase.
    
    const node: string = namehash(`${address}.addr.reverse`);

    const resolver = await this._createResolver(node, NAME_INTERFACE, NO_NAME_RESOLUTION, createNameResolver, NO_REVERSE_RESOLUTION_SET);

    const name: string = await resolver.methods.name(node).call();
    if (!name){ 
      throw new Error(NO_REVERSE_RESOLUTION_SET);
    }

    return name;
  }
}
