import { ChainId } from './enums';
import { TransactionOptions } from './options';

/**
 * Set of resolution related methods
 */
export interface Resolutions {
  /**
   * Resolves the given domain using the AbstractAddrResolver interface.
   *
   * @param domain - Domain to be resolved
   *
   * @return
   * Address resolution for the given domain
   */
  addr(domain: string): Promise<string>;

  /**
   * Resolves the given domain using the AbstractMultiChainResolver interface
   *
   * @param domain - Domain to be resolved
   * @param chainId - chain hexa or index listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   */
  chainAddr(domain: string, chainId: ChainId): Promise<string>;

  /**
   * Sets addr for the given domain using the AbstractAddrResolver interface.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param options - Custom configs to be used when submitting the transaction
   * @param parentNode - The namehash of the parentNode. Should be used if the method is called right after a subdomain creation tx,
   * in this case, it will get the resolver of this node because it will be the same than the just created node.
   *
   */
  setAddr(
    domain: string, addr: string, options?: TransactionOptions, parentNode?: string
  ): Promise<string>;

  /**
   * Sets addr for the given domain using the AbstractMultiChainResolver interface.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setChainAddr(
    domain: string, addr: string, chainId: ChainId, options?: TransactionOptions
  ): Promise<string>;

  /**
   * Get decoded contenthash of a given domain.
   *
   * @param domain - Domain to be resolved
   */
  contenthash(domain: string): Promise<DecodedContenthash>;

  /**
   * Set contenthash of a given domain.
   *
   * @param domain - Domain to be resolved
   * @param content - Content to be associated to the given domain. Must be decoded, the library will encode and save it.
   */
  setContenthash(domain: string, content: string, options?: TransactionOptions): any;

  /**
   * Get resolver of a given domain.
   *
   * @param domain - Domain to be resolved
   */
  resolver(domain: string): Promise<string>;

  /**
   * Set resolver of a given domain.
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setResolver(
    domain: string, resolver: string, options?: TransactionOptions,
  ): Promise<string>;

  /**
   * Set reverse resolution with the given name for the current address.
   *
   * @param name - Name to be set as the reverse resolution of the current address
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setName(name: string, options?: TransactionOptions): Promise<string>;

  /**
   * Reverse lookup: get name of a given address.
   *
   * @param address - address to be resolved
   *
   * @returns
   * Domain or subdomain associated to the given address.
   */
  name(address: string): Promise<string>;
}

export interface DecodedContenthash {
  protocolType: string;

  decoded: string;
}
