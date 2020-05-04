import Web3 from 'web3';
import { NetworkId } from './enums';

/**
 * Set of utils and validators methods
 */
export interface Utils {
  /**
   * Checks if the given web3 instance has accounts to sign txs
   *
   * @param web3 - Web3 instance
   *
   * @returns
   * true if has accounts, false if not
   */
  hasAccounts(web3: Web3): Promise<boolean>;

  /**
   * Checks if the contract in the given address has the given method
   *
   * @param contractAddress - address of the contract to check
   * @param signatureHash - keccak256 of the method signature
   *
   * @returns
   * true if method exists, false if not
   */
  hasMethod(web3: Web3, contractAddress: string, signatureHash: string): Promise<boolean>;

  /**
   * Validates the given label
   *
   * @param label - label to validate
   *
   * @returns
   * true if valid, false if not
   */
  isValidLabel(label: string): boolean;

  /**
   * Validates the given domain syntax
   *
   * @param domain - domain to validate
   *
   * @returns
   * true if valid, false if not
   */
  isValidDomain(domain:string): boolean;

  /**
   * Validates the given domain TLD
   *
   * @param domain - domain to validate
   *
   * @returns
   * true if valid, false if not
   */
  isValidTld(domain:string): boolean;

  /**
   * Validates the given address syntax
   *
   * @param address
   *
   * @returns
   * true if valid, false if not
   */
  isValidAddress(address: string): boolean;

  /**
   * Validates the given checksum address for the given networkId
   *
   * @param address
   * @param networkId - chanetworkIdnId where checksummed address should be valid
   *
   * @returns
   * true if valid, false if not
   */
  isValidChecksumAddress(address: string, networkId?: NetworkId): boolean;

  /**
   * Generates checksum address
   *
   * @param address
   * @param networkId - networkId where checksummed address should be valid
   *
   * @returns
   * Checksummed address
   */
  toChecksumAddress(address: string, networkId?: NetworkId): string;

  /**
   * Returns namehash of the given domain
   *
   * @param domain - domain to apply namehash function
   *
   * @returns
   * namehash of the given domain
   */
  namehash(domain:string): string;

  /**
   * Returns '0x' + keccak256 of the given label
   *
   * @param label - label to apply keccak256 function
   *
   * @returns
   * '0x' + keccak256 of the given label
   */
  labelhash(label:string): string;
}
