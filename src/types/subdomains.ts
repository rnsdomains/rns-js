import { TransactionReceipt } from 'web3-eth';
import { TransactionOptions } from './options';

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
   * Sets a subdomain owner. If the subdomain exists, sets the new owner, if not, creates the subdomain and sets the owner.
   *
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  setOwner(
    domain: string, label: string, owner: string, options?: TransactionOptions,
  ): Promise<TransactionReceipt>;

  /**
   * Creates a new subdomain under the given domain tree if it is available, and sets its resolution if addr is provided.
   * It could send one, two or three transactions based on the value of the sent parameters.
   *
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain. If not provided, the address who executes the tx will be the owner
   * @param addr - The address to be set as resolution of the new subdomain
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  create(
    domain: string, label: string, owner?: string, addr?: string, options?: TransactionOptions,
  ): Promise<TransactionReceipt>;
}
