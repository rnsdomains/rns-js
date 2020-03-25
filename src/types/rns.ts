import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import { ChainId } from './enums';
import { Utils } from './utils';
import { Subdomains } from './subdomains';

/**
 * Contains the necessary contract addresses to run the current lib.
 */
export interface ContractAddresses {
  /**
   * RNS.sol address
   */
  registry: string
}

/**
 * Configuration object used to run the lib if the current network is not RSK Mainnet or RSK Testnet
 */
export interface Options {
  contractAddresses?: ContractAddresses,
  networkId?: number
}

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
   * Web3 instance used to interact with the blockchain
   */
  web3: Web3;

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
   * Set address resolution of a given domain.
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   */
  setAddr(domain: string, addr: string): Promise<TransactionReceipt>;

  /**
   * Set resolver of a given domain.
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   */
  setResolver(domain: string, resolver: string): Promise<TransactionReceipt>;

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
