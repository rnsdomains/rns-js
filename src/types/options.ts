import { Lang } from './enums';

/**
 * Contains the necessary contract addresses to run the current lib.
 */
export interface ContractAddresses {
  /**
   * RNS.sol address
   */
  registry: string;
}

/**
 * Configuration object used to run the lib if the current network is not RSK Mainnet or RSK Testnet
 */
export interface Options {
  contractAddresses?: ContractAddresses,
  networkId?: number,
  lang?: Lang,
}

/**
 * Configuration object used to set custom options when sending transactions
 */
export interface TransactionOptions {
  gasPrice?: string,
  gas?: number,
  from?: string,
}
