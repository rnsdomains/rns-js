import { TransactionReceipt } from 'web3-eth';
import { ChainId } from './enums';

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
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   */
  chainAddr(domain: string, chainId: ChainId): Promise<string>;

  /**
   * Sets addr for the given domain using the AbstractAddrResolver interface.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   */
  setAddr(domain: string, addr: string): Promise<TransactionReceipt>;

  /**
   * Sets addr for the given domain using the AbstractMultiChainResolver interface.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   */
  setChainAddr(domain: string, addr: string, chainId: ChainId): Promise<TransactionReceipt>;

  /**
   * Set resolver of a given domain.
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   */
  setResolver(domain: string, resolver: string): Promise<TransactionReceipt>;

  /**
   * Set reverse resolution with the given name for the current address.
   *
   * @param name - Name to be set as the reverse resolution of the current address
   */
  setName(name: string): Promise<TransactionReceipt>;

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
