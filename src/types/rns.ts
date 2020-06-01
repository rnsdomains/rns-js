import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import { ChainId, CoinType } from './enums';
import { Utils } from './utils';
import { Subdomains } from './subdomains';
import { TransactionOptions } from './options';

/**
 * web3.eth.Contract wrapper. Contains an instance for each Contract used to run the lib.
 */
export interface Contracts {
  /**
   * RNS.sol instance
   */
  registry: Contract
}

/**
 * RNS JavaScript library.
 */
export default interface RNS {
  /**
   * Web3 or Rsk3 instance used to interact with the blockchain
   */
  blockchainApi: Web3 | any;

  /**
   * RNS suite contract instances
   *
   * @returns Object with a web3.eth.Contract instance for each necessary contract.
   */
  contracts: Contracts;

  /**
   * Get address of a given domain and chain.
   * If chainId is not provided, it resolves current blockchain address.
   *
   * @param domain - Domain to be resolved
   * @param chainId - Should match one of the listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   *
   * @return
   * Address resolution for the given domain in the given chain (if provided)
   */
  addr(domain: string, chainId?: ChainId): Promise<string>;

  /**
   * Set address resolution of a given domain in a given chain.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param chainId - Should match one of the listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setAddr(
    domain: string, addr: string, chainId?: ChainId | CoinType, options?: TransactionOptions,
  ): Promise<TransactionReceipt>;

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
  ): Promise<TransactionReceipt>;

  /**
   * Set reverse resolution with the given name for the current address.
   *
   * @param name - Name to be set as the reverse resolution of the current address
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setReverse(name: string, options?: TransactionOptions): Promise<TransactionReceipt>;

  /**
   * Reverse lookup: get name of a given address.
   *
   * @param address - address to be resolved
   *
   * @returns
   * Domain or subdomain associated to the given address.
   */
  reverse(address: string): Promise<string>;

  /**
   * Check if given domain is available or if there are any availability for the given label.
   *
   * @param domain - Domain or label to check availability
   *
   * @returns
   * True if the domain is available, false if not, or an array of available domains under possible TLDs if the parameter is a label
   */
  available(domain: string): Promise<boolean | string[]>

  /**
   * Set of subdomains related methods
   *
   * @returns Object with subdomains related methods ready to use.
   */
  subdomains: Subdomains;

  /**
   * Set of utils and validators methods
   *
   * @returns Object with utils methods
   */
  utils: Utils;
}
