import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';

/**
 * RSK Mainnet and Testnet network ids. Used to identify the current network.
 */
export enum NetworkId {
  RSK_MAINNET = 30,
  RSK_TESTNET = 31
}

/**
 * Represents some of the chain ids listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md) 
 */
export enum ChainId {
  RSK_MAINNET = '0x80000089',
  BITCOIN_MAINNET = '0x80000000',
  ETHEREUM_MAINNET = '0x8000003c',
  LITECOIN = '0x80000002'
}

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
  contractAddresses?: ContractAddresses
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
export interface RNS {
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
   * Get address of a given domain and chain. If chainId is not provided, it resolves current blockchain address.
   *
   * @param domain - Domain to be resolved
   * @param chainId - Should match one of the listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   * 
   * @return 
   * Address resolution for the given domain in the given chain (if provided)
   */
  addr(domain: string, chainId?: ChainId): Promise<string>;

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
}

export interface Composable {
  /**
   * Detects the current network and instantiates the contracts.
   */
  compose(): void;
}

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
   * Reverse lookup: get name of a given address.
   * 
   * @param address - address to be resolved
   * 
   * @returns
   * Domain or subdomain associated to the given address.
   */
  name(address: string): Promise<string>;
}

/**
 * Set of subdomains related methods
 */
export interface Subdomains {
  /**
   * Checks if the given label subdomain is available under the given domain tree
   * 
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to check if is available. ie: alice
   * 
   * @returns
   * true if available, false if not
   */
  available(domain: string, label: string): Promise<boolean>;

  /**
   * Creates a new subdomain under the given domain tree
   * 
   * 
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain
   */
  create(domain: string, label: string, owner: string): Promise<void>;
}
