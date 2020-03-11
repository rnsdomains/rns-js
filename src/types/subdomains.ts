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
  setOwner(domain: string, label: string, owner: string): Promise<void>;
}
